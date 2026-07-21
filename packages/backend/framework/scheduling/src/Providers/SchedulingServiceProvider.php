<?php

declare(strict_types=1);

/**
 * @file packages/scheduling/src/Providers/SchedulingServiceProvider.php
 *
 * @description
 * Package entry point for `stackra/scheduling`. Wires the
 * discovery + registrar into the host application, and defers
 * every actual `Schedule::job()` / `Schedule::command()` call
 * until Laravel's own scheduler binding is being resolved.
 *
 * ## Zero-body bindings (ADR 0006)
 *
 * The two collaborator services in this package carry
 * `#[Singleton]` on their class body:
 *
 *   - {@see \Stackra\Scheduling\Support\ScheduleDiscovery}
 *   - {@see \Stackra\Scheduling\Support\ScheduleRegistrar}
 *
 * The registrar's constructor also carries three `#[Config]`
 * parameters — `scheduling.discovery.cache_path`,
 * `scheduling.discovery.cache`, `scheduling.timezone` — so
 * container resolution reads config values automatically. No
 * imperative binding closure is required in this provider.
 *
 * ## Responsibilities
 *
 *   1. Merge the shipped `config/scheduling.php` under the
 *      `scheduling.*` key so consumers get sensible defaults
 *      without any boilerplate.
 *   2. Publish the config for env-specific overrides.
 *   3. Register the after-resolving hook on the `Schedule`
 *      container binding — when Laravel resolves the scheduler
 *      for the first time (typically at
 *      `php artisan schedule:run` startup) the hook fires and
 *      the registrar iterates every
 *      {@see \Stackra\Scheduling\Support\ScheduledTask} the
 *      discovery layer emits.
 *
 * ## What it deliberately does NOT do
 *
 *   - Does not touch `app/Console/Kernel.php`. Callers keep the
 *     stock Laravel skeleton — this provider slots underneath
 *     via the `callAfterResolving` hook.
 *   - Does not run discovery at register time. Doing so would
 *     force reflection on every attributed class during the
 *     container boot even when the app isn't invoking the
 *     scheduler (HTTP requests, queue workers). Deferring keeps
 *     the boot cost isolated to the scheduler process.
 */

namespace Stackra\Scheduling\Providers;

use Stackra\Scheduling\Support\ScheduleRegistrar;
use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\OnBoot;
use Stackra\ServiceProvider\Attributes\OnRegister;
use Stackra\ServiceProvider\Providers\ServiceProvider;
use Illuminate\Console\Scheduling\Schedule;

/**
 * Wires the attribute-driven scheduling engine into the host app.
 *
 * `#[LoadsResources]` is present with defaults (all flags false)
 * because this package doesn't ship views / translations /
 * migrations under the conventional paths. Every wiring step
 * happens explicitly below via lifecycle attributes.
 */
#[AsModule(name: 'Scheduling', priority: 60)]
#[LoadsResources()]
final class SchedulingServiceProvider extends ServiceProvider
{
    /**
     * Merge the package's shipped defaults under `scheduling.*`
     * during the register phase.
     *
     * Priority 10 sorts this ahead of any downstream provider that
     * reads `scheduling.*` in its own boot logic.
     */
    #[OnRegister(priority: 10)]
    protected function mergeConfig(): void
    {
        $this->mergeConfigFrom(
            __DIR__ . '/../../config/scheduling.php',
            'scheduling',
        );
    }

    /**
     * Publish the config so operators can override defaults per
     * environment via `php artisan vendor:publish --tag=scheduling-config`.
     */
    #[OnBoot(priority: 10)]
    protected function publishConfig(): void
    {
        $this->publishes([
            __DIR__ . '/../../config/scheduling.php' => $this->app->configPath('scheduling.php'),
        ], 'scheduling-config');
    }

    /**
     * Defer registration of every discovered task until the
     * `Schedule` binding is being resolved — invoked at boot.
     *
     * ## Why `callAfterResolving`
     *
     * The scheduler is only useful in console context
     * (`php artisan schedule:run`). Hooking into
     * `callAfterResolving` means an HTTP request that never
     * touches `Schedule` pays zero cost — the discovery pass
     * fires only when the scheduler is actually being assembled.
     */
    #[OnBoot(priority: 100)]
    protected function registerTasksOnScheduleResolve(): void
    {
        $this->callAfterResolving(Schedule::class, function (Schedule $schedule): void {
            /** @var ScheduleRegistrar $registrar */
            $registrar = $this->app->make(ScheduleRegistrar::class);

            $registrar->register($schedule);
        });
    }
}
