<?php

/**
 * @file src/Providers/ScopeServiceProvider.php
 *
 * @description
 * Service provider for the scope framework package. Wired
 * attribute-first per ADR 0006 — the `#[Bind]` + `#[Scoped]` /
 * `#[Singleton]` attributes on the contract interfaces do the
 * container wiring; `#[AsScopeResolver]` on each resolver class
 * drives its registration into the chain. What lives HERE is the
 * residual boot logic that attribute discovery can't express:
 *
 *   1. `#[LoadsResources]` flips on migrations + config +
 *      publishables + seeders (per ADR 0011).
 *   2. `#[OnBoot]` — walks `olvlvl/composer-attribute-collector`
 *      for `#[AsScopeResolver]` classes and hydrates the
 *      resolver chain.
 *   3. `#[OnBoot]` — registers the `scope` middleware alias so
 *      route files attach the middleware by name.
 */

declare(strict_types=1);

namespace Academorix\Scope\Providers;

use Academorix\Scope\Attributes\AsScopeResolver;
use Academorix\Scope\Attributes\ScopedTo;
use Academorix\Scope\Contracts\ScopeResolverChainInterface;
use Academorix\Scope\Contracts\ScopeResolverInterface;
use Academorix\Scope\Http\Middleware\ResolveScope;
use Academorix\Scope\Scopes\ScopedGlobalScope;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\OnBoot;
use Academorix\ServiceProvider\Providers\ServiceProvider;
use Illuminate\Container\Attributes\Config;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Routing\Router;

/**
 * Scope framework provider.
 *
 * Priority `20` — scope sits BELOW tenancy in the load order.
 * Tenancy (priority `30`) contributes its own resolver via
 * `#[AsScopeResolver]`; because tenancy boots later, its
 * discovery pass has already run by the time our chain
 * hydration fires. That's fine — the chain is a singleton
 * populated at boot; both providers append to the same
 * instance, and the final sort happens in the chain itself.
 */
#[AsModule(name: 'Scope', priority: 20)]
#[LoadsResources(
    // Migrations ship under `database/migrations/` (Laravel
    // convention — same layout every module in this monorepo
    // uses); the LoadsResources concern auto-loads that path
    // when the flag is true.
    migrations: true,
    // Config file ships under `config/scope.php`, merged under
    // the `scope.*` key by the LoadsResources concern.
    config: true,
    // No commands in this initial pass. Follow-up work will add
    // `scope:tree:show`, `scope:migrate-legacy`, etc.
    commands: false,
    // Seeders ship under `database/seeders/` — each carrying
    // `#[AsSeeder(priority: N)]` per ADR 0011. Every scope
    // seeder is marked `$isDemoOnly = true` so production
    // `db:seed` runs skip them.
    seeders: true,
    publishables: true,
)]
final class ScopeServiceProvider extends ServiceProvider
{
    /**
     * Walk `olvlvl/composer-attribute-collector` for every
     * `#[AsScopeResolver]` target and register it into the chain.
     *
     * Follows the same recipe as `CachingServiceProvider::discoverResolvers()`
     * so contributors have one mental model for "resolver
     * discovery" across the framework. When the collector index
     * isn't present (fresh install before `composer dump-autoload`),
     * the pass is a no-op — the chain stays empty and the
     * middleware fails 428 in strict mode or passes through in
     * loose mode.
     */
    #[OnBoot(priority: 10)]
    protected function discoverScopeResolvers(): void
    {
        // The collector class is emitted by
        // `olvlvl/composer-attribute-collector` at composer-dump
        // time. Referenced by string so this package loads cleanly
        // even in packaged tests that don't wire the collector.
        $collectorClass = '\\Composer\\Attribute\\Collection';
        if (! \class_exists($collectorClass)) {
            return;
        }

        /** @var ScopeResolverChainInterface $chain */
        $chain = $this->app->make(ScopeResolverChainInterface::class);

        /**
         * @var iterable<object{ name: class-string, attribute: AsScopeResolver }> $targets
         *                                                                         The collector's `findTargetClasses()` returns
         *                                                                         TargetClass value objects — one per class carrying an
         *                                                                         `#[AsScopeResolver]` (repeatable → multiple targets
         *                                                                         per class are legal, so we iterate all of them).
         */
        $targets = $collectorClass::findTargetClasses(AsScopeResolver::class);

        foreach ($targets as $target) {
            $attribute = $target->attribute;

            // Feature-flagged resolvers can stay in the codebase
            // but be silently omitted from the chain — useful
            // for gradual rollouts.
            if (! $attribute->enabled) {
                continue;
            }

            $class = $target->name;

            // Ignore mis-tagged classes silently — the
            // architecture rule will catch these at PHPStan time.
            if (! \is_subclass_of($class, ScopeResolverInterface::class)) {
                continue;
            }

            /** @var ScopeResolverInterface $resolver */
            $resolver = $this->app->make($class);
            $chain->register($resolver);
        }
    }

    /**
     * Register the `scope` route-middleware alias so route files
     * can attach the middleware by name instead of class-string.
     *
     * The alias comes from config so deployments can rename it if
     * they need to (rare, but useful when two packages ship
     * middleware with the same short name).
     *
     * @param  Router  $router  Injected — the routing kernel.
     * @param  string  $aliasName  Injected via `#[Config]`.
     */
    #[OnBoot(priority: 20)]
    protected function registerMiddlewareAlias(
        Router $router,
        #[Config('scope.middleware.alias', 'scope')]
        string $aliasName = 'scope',
    ): void {
        $router->aliasMiddleware($aliasName, ResolveScope::class);
    }

    /**
     * Walk `#[ScopedTo]` classes and auto-attach the global scope.
     *
     * Every Eloquent model that opts into scope-platform filtering
     * carries the `#[ScopedTo]` attribute. Instead of asking each
     * model to boot its own global scope in a `booted()` hook, we
     * discover every such class at boot and attach
     * {@see ScopedGlobalScope} centrally. That way:
     *
     *   * Consumer domain modules stay `#[ScopedTo]`-only — no
     *     bespoke boot code per model.
     *   * A future change to the global-scope contract touches ONE
     *     class (`ScopedGlobalScope`) instead of dozens.
     *   * The auto-scope feature-flag
     *     (`scope.eloquent.auto_scope_enabled`) can flip the whole
     *     surface off in one place for tests that need cross-scope
     *     reads.
     *
     * Runs at priority `30` — after the resolver chain hydrates
     * (priority `10`) and after the middleware alias registers
     * (priority `20`), so the ambient state is ready by the time
     * a model boot fires a query.
     *
     * @param  ScopedGlobalScope  $globalScope  Injected — the
     *                                          concrete scope instance to attach. Container-
     *                                          resolved so its `#[Config]` params get filled.
     */
    #[OnBoot(priority: 30)]
    protected function autoRegisterScopedModels(ScopedGlobalScope $globalScope): void
    {
        // Guard identical to `discoverScopeResolvers()` — no
        // collector, no discovery. The scope package still works
        // in bare tests; models just don't auto-scope until the
        // collector index is regenerated.
        $collectorClass = '\\Composer\\Attribute\\Collection';
        if (! \class_exists($collectorClass)) {
            return;
        }

        /**
         * @var iterable<object{ name: class-string, attribute: ScopedTo }> $targets
         *                                                                  Every class carrying `#[ScopedTo]`. In practice this is
         *                                                                  a small set (< 100) even in large monorepos, so the
         *                                                                  linear walk is a one-time boot cost, not a hot path.
         */
        $targets = $collectorClass::findTargetClasses(ScopedTo::class);

        foreach ($targets as $target) {
            $class = $target->name;

            // Skip anything that isn't an actual Eloquent model —
            // the attribute is `TARGET_CLASS` so someone might
            // paste it on the wrong thing. Silently ignore rather
            // than fatal; the architecture rule (follow-up) will
            // flag mis-tags at PHPStan time.
            if (! \is_subclass_of($class, Model::class)) {
                continue;
            }

            // `addGlobalScope` is a static late-bound call on the
            // model class. Every subsequent query on that model —
            // in this request and every subsequent one on the same
            // worker — carries the ancestor-chain filter.
            $class::addGlobalScope($globalScope);
        }
    }
}
