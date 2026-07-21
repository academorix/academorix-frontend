<?php

declare(strict_types=1);

/**
 * @file packages/service-provider/src/Providers/ServiceProvider.php
 *
 * @description
 * Abstract base class every Stackra module service provider
 * extends. Composes the full attribute-driven lifecycle via the
 * {@see AsModuleProvider} trait and wires it into Laravel's own
 * `register()` / `boot()` sequence so concrete providers get the
 * whole machinery for free — no host "Application" runner needed.
 *
 * ## Why self-driving lifecycle
 *
 * The {@see AsModuleProvider} trait exposes {@see registerModule()}
 * and {@see bootModule()} — the entry points that resolve
 * `#[AsModule]` / `#[LoadsResources]`, dispatch the remaining hook
 * interfaces ({@see HasBindings}, {@see HasMacros}), fire lifecycle
 * events, and register `#[OnRegister]` / `#[OnBoot]` /
 * `#[OnTerminate]` method callbacks.
 *
 * Historical hook interfaces (`HasMiddleware`, `HasRoutes`,
 * `HasObservers`, `HasPolicies`, `HasHealthChecks`,
 * `HasScheduledTasks`, `Terminatable`) were deleted — every one
 * had a redundant attribute in a domain package:
 * `#[AsMiddleware]` (routing), `#[AsController]` (routing),
 * `#[ObservedBy]` / `#[UsePolicy]` (Laravel native),
 * `#[AsHealthCheck]` (health), `#[Schedule]` (scheduling),
 * `#[OnTerminate]` (this package). Attribute-first, single seam.
 *
 * Without a bridge, those trait methods are inert — Laravel calls
 * a provider's `register()` and `boot()`, not `registerModule()`
 * / `bootModule()`. This class supplies that bridge so the
 * standard PHP inheritance chain does the right thing.
 *
 * ## Extension patterns (three shapes, use the one that fits)
 *
 *   1. **Fully declarative** — put every knob into attributes /
 *      hook interfaces. No `register()` / `boot()` override
 *      required.
 *
 *   ```php
 *   #[AsModule(name: 'Blog', priority: 10)]
 *   #[LoadsResources(views: true, seeders: true)]
 *   final class BlogServiceProvider extends ServiceProvider
 *       implements HasBindings
 *   {
 *       public function bindings(): void
 *       {
 *           $this->app->singleton(BlogRepo::class, EloquentBlogRepo::class);
 *       }
 *
 *       // Model → Policy: use `#[UsePolicy(PostPolicy::class)]` on
 *       // the Post model (Laravel native).
 *       // Middleware alias: use `#[AsMiddleware(alias: 'blog.gate')]`
 *       // on the middleware class (routing package).
 *   }
 *   ```
 *
 *   2. **Method-attribute callbacks** — one-off logic per phase.
 *
 *   ```php
 *   #[AsModule(name: 'Blog')]
 *   final class BlogServiceProvider extends ServiceProvider
 *   {
 *       #[OnRegister(priority: 10)]
 *       protected function bindStripe(): void
 *       {
 *           $this->app->singleton(StripeGateway::class, StripeGateway::class);
 *       }
 *
 *       #[OnBoot(priority: 90)]
 *       protected function warmCaches(): void
 *       {
 *           Cache::forever('blog.categories', $this->app->make(Categorizer::class)->all());
 *       }
 *   }
 *   ```
 *
 *   3. **Escape hatch — override `register()` / `boot()`** — reserved
 *      for wiring that must run before the trait's own resolution
 *      (rare — e.g. binding the config repository the trait later
 *      reads from). Always call `parent::register()` /
 *      `parent::boot()` so the module lifecycle still fires.
 *
 *   ```php
 *   final class BlogServiceProvider extends ServiceProvider
 *   {
 *       public function register(): void
 *       {
 *           // Framework-level wiring that must precede attribute
 *           // resolution, then hand back to the trait lifecycle.
 *           $this->app->singleton('blog.pre-boot', PreBootHook::class);
 *
 *           parent::register();
 *       }
 *   }
 *   ```
 *
 * ## Third-party bases — use the trait directly
 *
 * When a package must extend a vendor base class (Horizon,
 * Debugbar, Sentry, ...) it cannot also extend this class. Use the
 * {@see AsModuleProvider} trait instead and add the same bridge
 * inside the concrete provider:
 *
 * ```php
 * final class HorizonServiceProvider extends BaseHorizonServiceProvider
 * {
 *     use AsModuleProvider;
 *
 *     public function register(): void
 *     {
 *         parent::register();  // vendor wiring
 *         $this->registerModule();
 *     }
 *
 *     public function boot(): void
 *     {
 *         parent::boot();
 *         $this->bootModule();
 *     }
 * }
 * ```
 *
 * @see AsModuleProvider    The composition trait that owns the lifecycle.
 * @see ServiceProviderInterface The contract this class satisfies.
 */

namespace Stackra\ServiceProvider\Providers;

use Stackra\ServiceProvider\Concerns\AsModuleProvider;
use Stackra\ServiceProvider\Contracts\ServiceProviderInterface;
use Illuminate\Support\ServiceProvider as BaseServiceProvider;

/**
 * Abstract module service provider driving Stackra's attribute-first
 * boot lifecycle.
 *
 * Concrete subclasses declare their surface via `#[AsModule]`,
 * `#[LoadsResources]`, and hook interfaces. Both `register()` and
 * `boot()` below are the ONLY places Laravel enters this base —
 * they hand off to the {@see AsModuleProvider} trait, which then
 * drives every phase.
 */
abstract class ServiceProvider extends BaseServiceProvider implements ServiceProviderInterface
{
    use AsModuleProvider;

    /**
     * Laravel's register phase — hands off to the module lifecycle.
     *
     * Delegates to {@see AsModuleProvider::registerModule()}, which:
     *
     *   1. Resolves `#[AsModule]` (or auto-derives name / namespace /
     *      path from the class file location).
     *   2. Fires the `REGISTERING` module event.
     *   3. Dispatches `HasBindings::bindings()` and every method
     *      annotated with `#[OnRegister]` in priority order.
     *   4. Fires the `REGISTERED` module event.
     *
     * `registerModule()` is idempotent — safe under Octane worker
     * reuse. Concrete subclasses generally do NOT override this
     * method; when they must (see the "escape hatch" example in
     * the file docblock), calling `parent::register()` keeps the
     * lifecycle intact.
     */
    public function register(): void
    {
        $this->registerModule();
    }

    /**
     * Laravel's boot phase — hands off to the module lifecycle.
     *
     * Delegates to {@see AsModuleProvider::bootModule()}, which:
     *
     *   1. Fires the `BOOTING` module event.
     *   2. Loads conventional resources gated by `#[LoadsResources]`
     *      (migrations, config, translations, views).
     *   3. Discovers Symfony `#[AsCommand]` classes via olvlvl and
     *      registers them (gated by
     *      `#[LoadsResources(commands: true)]`).
     *   4. Registers publishable resources (config / views /
     *      translations / assets) when
     *      `#[LoadsResources(publishables: true)]`.
     *   5. Dispatches the two remaining hook interfaces
     *      ({@see HasBindings} — already fired during register
     *      phase, and {@see HasMacros}) plus every `#[OnBoot]`
     *      method in priority order.
     *   6. Registers every `#[OnTerminate]` method as an
     *      `$this->app->terminating(...)` callback.
     *   7. Fires the `BOOTED` module event.
     *
     * `bootModule()` is idempotent — safe under Octane. Override
     * only when framework-level boot work must precede attribute
     * resolution, and call `parent::boot()` when you do.
     */
    public function boot(): void
    {
        $this->bootModule();
    }
}
