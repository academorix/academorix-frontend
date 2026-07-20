<?php

declare(strict_types=1);

/**
 * @file packages/service-provider/src/Attributes/LoadsResources.php
 *
 * @description
 * Declaratively configures which conventional-path resources a
 * service provider should auto-load at boot. Consumed by the
 * {@see \Academorix\ServiceProvider\Concerns\LoadsResources} trait
 * during the boot phase.
 *
 * ## Attribute-first — what this attribute deliberately does NOT cover
 *
 * Every concern already served by a dedicated attribute + discovery
 * elsewhere in the monorepo is intentionally absent from this
 * surface — we don't want two ways to do the same thing.
 * Specifically, these are NOT flags here:
 *
 *   - Middleware aliases → `#[AsMiddleware]` on the middleware
 *     class, discovered by `RoutingServiceProvider`.
 *   - Route registration → `#[AsController]` on the controller
 *     class, discovered by `RouteRegistrar` (we forbid
 *     `routes/*.php`).
 *   - Model observers → `#[ObservedBy]` on the model (Laravel
 *     native).
 *   - Authorization policies → `#[UsePolicy]` on the model
 *     (Laravel native).
 *   - Health checks → `#[AsHealthCheck]` on the check class,
 *     discovered by the health package.
 *   - Scheduled tasks → `#[Schedule]` / `#[Cron]` /
 *     `#[ScheduleWhen]` on the job/command, discovered by the
 *     scheduling package.
 *   - Event listeners → `#[OnEvent]` (class) / `#[ListensFor]`
 *     (method), discovered by the events package.
 *   - Terminate hooks → `#[OnTerminate]` method attribute in this
 *     same package.
 *
 * The remaining flags are for resources without a dedicated
 * attribute discovery — the "raw" file-system loading that
 * Laravel exposes via `loadMigrationsFrom()` / `mergeConfigFrom()`
 * / `loadTranslationsFrom()` / `loadViewsFrom()` / `commands()` /
 * `publishes()` and the macros hook.
 *
 * ## Defaults
 *
 * Every flag defaults to `false`. Providers opt IN explicitly to
 * any conventional resource loading they want. This matches our
 * house rule that intent should be visible on the class surface:
 * a `#[LoadsResources]` attribute — or the absence of one — is a
 * concrete statement about what the provider ships.
 *
 * The alternative (defaults-on for a common six) was inherited
 * from the academorix origins where every package followed a strict
 * shape (`src/Migrations/`, `src/i18n/`, `config/config.php`,
 * `src/routes/`). Our packages deliberately keep the classic
 * Laravel layout (`database/migrations/`, `lang/`,
 * `config/{name}.php`) which none of those conventional paths
 * match. Defaults-on would fire silent no-ops for every provider
 * — a misleading "everything loads" that in fact loads nothing.
 *
 * When authoring a new package that DOES adopt the conventional
 * layout, opt IN with `#[LoadsResources(migrations: true, ...)]`.
 * When authoring a package with custom paths (the current norm),
 * omit the attribute entirely and drive loading manually via
 * `#[OnRegister]` / `#[OnBoot]` methods.
 *
 * @category Attributes
 *
 * @since    1.0.0
 */

namespace Academorix\ServiceProvider\Attributes;

use Academorix\ServiceProvider\Compiler\DeferredProviderCompiler;
use Attribute;

/**
 * Configures which convention-based resources a service provider
 * loads at boot.
 *
 * Usage (accept defaults — nothing loads until you opt in):
 *   #[LoadsResources]
 *   class MyServiceProvider extends ServiceProvider { ... }
 *
 * Usage (opt into conventional command discovery):
 *   #[LoadsResources(commands: true)]
 *   class MyServiceProvider extends ServiceProvider { ... }
 *
 * Usage (a package that fully adopts conventional layout):
 *   #[LoadsResources(
 *       migrations: true,
 *       config: true,
 *       translations: true,
 *       views: true,
 *       commands: true,
 *       publishables: true,
 *   )]
 *   class MyServiceProvider extends ServiceProvider { ... }
 *
 * Usage (custom paths — the current norm; omit the attribute):
 *   // No `#[LoadsResources]` needed — drive loading manually via
 *   // `#[OnRegister]` + `#[OnBoot]` methods.
 *   class MyServiceProvider extends ServiceProvider implements HasBindings
 *   {
 *       #[OnRegister]
 *       protected function mergeConfig(): void
 *       {
 *           $this->mergeConfigFrom(__DIR__.'/../../config/my.php', 'my');
 *       }
 *   }
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class LoadsResources
{
    /**
     * @var string Attribute parameter name for migrations flag.
     */
    public const ATTR_MIGRATIONS = 'migrations';

    /**
     * @var string Attribute parameter name for views flag.
     */
    public const ATTR_VIEWS = 'views';

    /**
     * @var string Attribute parameter name for translations flag.
     */
    public const ATTR_TRANSLATIONS = 'translations';

    /**
     * @var string Attribute parameter name for config flag.
     */
    public const ATTR_CONFIG = 'config';

    /**
     * @var string Attribute parameter name for commands flag.
     */
    public const ATTR_COMMANDS = 'commands';

    /**
     * @var string Attribute parameter name for seeders flag.
     */
    public const ATTR_SEEDERS = 'seeders';

    /**
     * @var string Attribute parameter name for publishables flag.
     */
    public const ATTR_PUBLISHABLES = 'publishables';

    /**
     * @var string Attribute parameter name for macros flag.
     */
    public const ATTR_MACROS = 'macros';

    /**
     * Create a new LoadsResources attribute instance.
     *
     * Every flag defaults to `false`. Providers opt IN explicitly
     * to any conventional resource loading they want. See the
     * class docblock for the rationale + usage examples.
     *
     * Concerns already served by dedicated attributes elsewhere in
     * the monorepo are deliberately NOT flags here — see the class
     * docblock's "attribute-first" section for the full list.
     *
     * @param  bool  $migrations  Load database migrations from Migrations/ directory. Default: false.
     * @param  bool  $views  Load Blade views with module namespace. Default: false.
     * @param  bool  $translations  Load translation/i18n files with module namespace. Default: false.
     * @param  bool  $config  Merge module configuration files. Default: false.
     * @param  bool  $commands  Discover and register Artisan commands via #[AsCommand]. Default: false.
     * @param  bool  $seeders  Register database seeders by convention. Default: false.
     * @param  bool  $publishables  Register publishable assets, config, views, translations. Default: false.
     * @param  bool  $macros  Dispatch HasMacros hook for macro registration. Default: false.
     */
    public function __construct(
        public bool $migrations = false,
        public bool $views = false,
        public bool $translations = false,
        public bool $config = false,
        public bool $commands = false,
        public bool $seeders = false,
        public bool $publishables = false,
        public bool $macros = false,
    ) {}

    /**
     * Check if all resources are enabled.
     *
     * Not commonly needed — provided for symmetry with
     * `loadsNone()` and for compilers/analysers introspecting a
     * provider's declared surface.
     *
     * @return bool True if every resource flag is set to true.
     */
    public function loadsAll(): bool
    {
        return $this->migrations
            && $this->views
            && $this->translations
            && $this->config
            && $this->commands
            && $this->seeders
            && $this->publishables
            && $this->macros;
    }

    /**
     * Check if no resources are enabled.
     *
     * Used by {@see DeferredProviderCompiler}
     * to identify providers that only register bindings and could
     * be deferred. With defaults-off, a bare `new LoadsResources()`
     * returns `true` here — every flag starts false.
     *
     * @return bool True if every resource flag is set to false.
     */
    public function loadsNone(): bool
    {
        return ! $this->migrations
            && ! $this->views
            && ! $this->translations
            && ! $this->config
            && ! $this->commands
            && ! $this->seeders
            && ! $this->publishables
            && ! $this->macros;
    }
}
