<?php

declare(strict_types=1);

/**
 * AsModuleProvider Trait.
 *
 * The single composition trait that bundles all concern traits, providing
 * complete module service provider functionality.
 *
 * ## How It Works
 *
 * The custom Application (or a host provider that detects
 * `method_exists($provider, 'registerModule')`) calls `registerModule()`
 * after registration and `bootModule()` before booting. Zero manual
 * wiring needed anywhere on the consumer side.
 *
 * Module name and namespace are auto-derived from the provider class name
 * when not explicitly set via #[AsModule] attribute or properties:
 *   - `Stackra\Horizon\Providers\HorizonServiceProvider`
 *     → name: 'Horizon', namespace: 'Stackra\Horizon'
 *   - `Stackra\Nightwatch\Providers\NightwatchServiceProvider`
 *     → name: 'Nightwatch', namespace: 'Stackra\Nightwatch'
 *
 * ## Usage
 *
 * With the Stackra base ServiceProvider:
 *   ```php
 *   #[AsModule(name: 'Tenancy', priority: 10)]
 *   #[LoadsResources(migrations: true, config: true)]
 *   class TenancyServiceProvider extends ServiceProvider { }
 *   ```
 *
 * With a third-party base — just use the trait, nothing else:
 *   ```php
 *   class HorizonServiceProvider extends BaseHorizonServiceProvider
 *   {
 *       use AsModuleProvider;
 *   }
 *   ```
 *
 * @category Concerns
 *
 * @since    1.0.0
 */

namespace Stackra\ServiceProvider\Concerns;

use Stackra\ServiceProvider\Bootstrappers\BootstrapperDiscoveryBootstrapper;
use Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper;
use Stackra\ServiceProvider\Enums\ModuleLifecycleEvent;
use Stackra\ServiceProvider\Registry\BootstrapperRegistry;
use Stackra\ServiceProvider\Support\BootstrapperRunner;

/**
 * Complete service provider functionality as a composable trait.
 *
 * Composes 8 concern traits. The host application auto-detects this
 * trait via `method_exists($provider, 'registerModule')` and calls the
 * lifecycle methods at the right time.
 */
trait AsModuleProvider
{
    use DiscoversResources;
    use HasDebugging;
    use LoadsResources;
    use ManagesLifecycle;
    use PublishesResources;
    use ReadsAttributes;
    use RegistersHooks;
    use SupportsDeferredLoading;

    // =========================================================================
    // Lifecycle Guards
    // =========================================================================

    /**
     * Whether the register phase has executed.
     */
    private bool $moduleRegistered = false;

    /**
     * Whether the boot phase has executed.
     */
    private bool $moduleBooted = false;

    // =========================================================================
    // Lifecycle Methods (called by Application)
    // =========================================================================

    /**
     * Register the module.
     *
     * Called automatically by the Application after `$provider->register()`
     * completes. Resolves attributes (or auto-derives module identity from
     * the class name), fires lifecycle events, and dispatches register-phase
     * hooks (HasBindings, #[OnRegister]).
     *
     * Safe to call multiple times — guarded by flag.
     */
    public function registerModule(): void
    {
        if ($this->moduleRegistered) {
            return;
        }

        $this->moduleRegistered = true;

        $this->resolveAttributes();
        $this->fireEvent(ModuleLifecycleEvent::REGISTERING);
        $this->dispatchRegisterHooks();
        $this->fireEvent(ModuleLifecycleEvent::REGISTERED);
    }

    /**
     * Boot the module.
     *
     * Called automatically by the Application before `$provider->boot()`
     * runs. Loads resources, discovers resources, registers publishables,
     * and dispatches boot-phase hooks.
     *
     * Safe to call multiple times — guarded by flag.
     */
    public function bootModule(): void
    {
        if ($this->moduleBooted) {
            return;
        }

        $this->moduleBooted = true;

        // Framework-wide bootstrapper sweep — priority `-900` in
        // spirit: fires BEFORE every consumer's `#[OnBoot]` methods
        // (default priority `100`) so populated registries exist by
        // the time domain code touches them. The runner's own
        // one-shot guard makes repeat invocations across every
        // module provider a no-op after the first sweep.
        $this->runFrameworkBootstrappers();

        $this->resolveAttributes();
        $this->fireEvent(ModuleLifecycleEvent::BOOTING);
        $this->loadResources();
        $this->discoverResources();
        $this->registerPublishables();
        $this->dispatchBootHooks();
        $this->fireEvent(ModuleLifecycleEvent::BOOTED);
    }

    /**
     * Trigger the {@see BootstrapperRunner}
     * sweep at the top of the boot phase.
     *
     * Eagerly registers every framework meta-bootstrapper the
     * runner needs to see BEFORE its iteration starts:
     *
     *   1. {@see BootstrapperDiscoveryBootstrapper} (priority `-1000`)
     *      — scans `#[AsBootstrapper]` and registers every domain
     *      bootstrapper.
     *   2. {@see HydrationBootstrapper} (priority `-900`) — scans
     *      `#[HydratesFrom]` on registry interfaces and hydrates each
     *      via a single generic pump, replacing the "one discovery
     *      bootstrapper class per attribute" pattern.
     *
     * Registration order doesn't matter — the registry sorts by
     * priority for iteration. Both are idempotent (the registry's
     * `has()` guard makes duplicate registrations a no-op) so
     * subsequent module providers' `bootModule()` calls are safe.
     *
     * The runner itself is a `#[Singleton]` and carries a one-shot
     * guard: only the FIRST module's `runFrameworkBootstrappers()`
     * actually sweeps; every subsequent module short-circuits.
     *
     * Failures are logged + swallowed — boot must never halt because
     * a bootstrapper misfired.
     */
    private function runFrameworkBootstrappers(): void
    {
        try {
            /** @var BootstrapperRegistry $registry */
            $registry = $this->app->make(BootstrapperRegistry::class);

            foreach ([
                BootstrapperDiscoveryBootstrapper::class,
                HydrationBootstrapper::class,
            ] as $meta) {
                if (! $registry->has($meta)) {
                    $registry->register($meta);
                }
            }

            /** @var BootstrapperRunner $runner */
            $runner = $this->app->make(BootstrapperRunner::class);
            $runner->run();
        } catch (\Throwable $e) {
            if (\function_exists('logger')) {
                \logger()->error('bootstrapper runner failed to start', [
                    'exception' => $e::class,
                    'message' => $e->getMessage(),
                ]);
            }
        }
    }
}
