<?php

declare(strict_types=1);

/**
 * @file packages/framework/database/src/Providers/DatabaseServiceProvider.php
 *
 * @description
 * Root service provider for `stackra/database`. Auto-discovered
 * by Laravel via `composer.json`'s `extra.laravel.providers`, so
 * consumer apps get the entire wiring by simply requiring the
 * package — no manual registration in `bootstrap/providers.php`.
 *
 * ## Post-ADR-0004 responsibilities
 *
 * Every cache primitive moved OUT of this package into
 * `packages/framework/caching/` (see ADR 0004). The tenant-aware
 * resolver moved into `packages/framework/tenancy/`. This
 * provider is now scoped exclusively to what actually is
 * database-layer: Blueprint macro discovery.
 *
 *   1. Discover every class carrying
 *      {@see \Stackra\Database\Attributes\AsDatabaseBlueprint}
 *      and call its static `register()` method — this is how the
 *      Schema Blueprint macros (`$table->archivable()`,
 *      `$table->sluggable()`, `$table->translatable()`, …) attach
 *      themselves to {@see \Illuminate\Database\Schema\Blueprint}.
 *
 * Macros are registered unconditionally (not console-gated). Some
 * legacy code paths exercise `Schema::create(...)` at runtime
 * (e.g. Sushi-backed fixture models spin up per-model SQLite
 * tables) and would break if the macros were console-gated. The
 * discovery pass is fast enough (< 1 ms for the ~13 Blueprint
 * files this package ships) that eager registration is the right
 * default.
 *
 * ## Zero manual bindings
 *
 * Per the architecture rule enforced by `packages/architecture`'s
 * `NoManualBindingsRule`, the provider carries no `bindings()`
 * method and no closure-based container registrations. Every DI
 * concern is delegated to Laravel's `#[Bind]`, `#[Singleton]`,
 * `#[Scoped]` attributes on the concrete classes.
 *
 * @see \Stackra\Database\Attributes\AsDatabaseBlueprint Marker attribute.
 * @see \Stackra\Database\Schema Every ported macro.
 * @see \Stackra\ServiceProvider\Providers\ServiceProvider New base class.
 */

namespace Stackra\Database\Providers;

use Stackra\Database\Attributes\AsDatabaseBlueprint;
use Stackra\Foundation\Contracts\DiscoversAttributes;
use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\OnBoot;
use Stackra\ServiceProvider\Providers\ServiceProvider;
use Throwable;

/**
 * Root service provider for the `stackra/database` package.
 *
 * Zero-body class beyond the two boot-time discovery hooks —
 * every concrete dependency is auto-wired via attributes on the
 * classes themselves.
 */
#[AsModule(name: 'Database', priority: 15)]
#[LoadsResources()]
final class DatabaseServiceProvider extends ServiceProvider
{
    /**
     * Discover every `#[AsDatabaseBlueprint]` target and invoke
     * its `register()` static method to install its Blueprint
     * macro.
     *
     * ## Deferred to `booted()`
     *
     * Any package that also owns Blueprint macros can register
     * during the same pass — the order is determined by the
     * attribute's `priority` field (lower runs first). Deferring
     * to `$this->app->booted(...)` guarantees every provider has
     * finished its own boot() before we walk the manifest,
     * avoiding "attribute target from another package not yet in
     * the collector" edge cases.
     */
    #[OnBoot(priority: 100)]
    protected function scheduleBlueprintMacroRegistration(): void
    {
        $this->app->booted(function (): void {
            $this->registerBlueprintMacros();
        });
    }

    /**
     * Enumerate every {@see AsDatabaseBlueprint} target via the
     * unified {@see DiscoversAttributes} contract and invoke each
     * target's `register()` static method.
     *
     * ## Failure isolation
     *
     * A single broken macro registrar must not stop the rest of
     * the pass. Log-and-continue is the same failure mode the
     * CRUD discovery uses.
     */
    private function registerBlueprintMacros(): void
    {
        /** @var DiscoversAttributes $discovery */
        $discovery = $this->app->make(DiscoversAttributes::class);

        // Materialise the iterable so we can sort by priority
        // before dispatching — the contract emits targets in
        // manifest order, not attribute priority order.
        $targets = [];
        foreach ($discovery->forClass(AsDatabaseBlueprint::class) as $target) {
            $targets[] = $target;
        }

        if ($targets === []) {
            return;
        }

        // Sort ascending by attribute priority. See the
        // AsDatabaseBlueprint attribute docblock for the ordering
        // contract.
        usort(
            $targets,
            static fn ($a, $b): int => $a->attribute->priority <=> $b->attribute->priority,
        );

        foreach ($targets as $target) {
            $className = $target->className;

            if (! is_callable([$className, 'register'])) {
                continue;
            }

            try {
                $className::register();
            } catch (Throwable $exception) {
                if (function_exists('logger')) {
                    logger()->error(
                        "Failed to register blueprint macro [{$className}]: {$exception->getMessage()}",
                    );
                }
            }
        }
    }
}
