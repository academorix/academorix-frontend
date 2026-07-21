<?php

/**
 * @file packages/health/src/Providers/HealthServiceProvider.php
 *
 * @description
 * Root service provider for `stackra/health`. Auto-discovered by
 * Laravel via `composer.json`'s `extra.laravel.providers`, so
 * consumer apps get the entire wiring by simply requiring the
 * package — no manual registration in `bootstrap/providers.php`.
 *
 * ## Attribute-only registration
 *
 * Every health check in every package declares itself via
 * {@see \Stackra\Health\Attributes\AsHealthCheck}. Discovery is
 * automated end-to-end:
 *
 *   1. `composer dump-autoload` scans every autoloadable class and
 *      writes every attribute target to `vendor/attributes.php`
 *      (via `olvlvl/composer-attribute-collector`).
 *   2. This provider's `boot()` runs discovery once at
 *      application startup — instantiates each target through
 *      Laravel's container (so DI works), applies the attribute's
 *      metadata (name, label, schedule, channel), and hands the
 *      finished list to Spatie's Health facade.
 *
 * ## Boot ordering
 *
 * Discovery MUST run AFTER every package's own `register()` has
 * completed (so any container bindings the checks depend on are
 * wired) but BEFORE Spatie's scheduled checks fire (so
 * registrations take effect on the very first tick).
 *
 * `$this->app->booted(...)` achieves that ordering — the closure
 * runs once every provider's `boot()` completes, which is when
 * `Health::checks(...)` is stable to call. Registering earlier
 * would race the scheduler; registering later would skip the first
 * scheduled run of every check.
 *
 * ## Octane safety
 *
 * All bindings are scoped or singleton. No static state, no facade
 * capture, no request references. Under Octane the provider
 * registers once per worker; the discovery result is memoised
 * within the discoverer instance so subsequent worker
 * request-lifecycles get a warm cache.
 *
 * ## Slim-build support
 *
 * The provider degrades gracefully when either Spatie's Health
 * facade OR the composer-attribute-collector runtime is absent
 * (test harnesses, unusual production builds). See {@see boot()}
 * for the guard chain.
 *
 * @see \Stackra\Health\Support\HealthCheckDiscoverer  The workhorse.
 * @see \Stackra\Health\Attributes\AsHealthCheck       Registration seam.
 */

declare(strict_types=1);

namespace Stackra\Health\Providers;

use Stackra\Health\Support\HealthCheckDiscoverer;
use Stackra\Health\Support\HealthNotificationConfig;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Contracts\Container\Container;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;
use Psr\Log\LoggerInterface;
use Spatie\Health\Facades\Health;
use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;

#[AsModule(name: 'Health', priority: 100)]
#[LoadsResources()]
final class HealthServiceProvider extends ServiceProvider
{
    /**
     * Register container bindings.
     *
     * All bindings are safe to construct at register-time — none of
     * them touch config values that other providers might mutate,
     * and none of them run discovery (which requires every provider
     * to have finished registering).
     */
    public function register(): void
    {
        // Merge the package's baseline config so consumers can rely
        // on `config('health.notifications')` even before publishing.
        $this->mergeConfigFrom(
            __DIR__ . '/../../config/health.php',
            'health',
        );

        // Load the composer-attribute-collector's generated attributes
        // file so `Attributes::findTargetClasses(...)` has a provider
        // to consult at runtime. The plugin generates this file at
        // `composer install` / `composer dump-autoload` but doesn't
        // register it in composer's autoload chain — consumers must
        // include it manually. Doing it here means every app that
        // requires this package gets the runtime wiring for free.
        //
        // The `class_exists()` guard prevents a crash in the rare
        // case where the plugin isn't installed (e.g. a slim test
        // harness). The `file_exists()` guard covers the "fresh
        // clone before first composer install" edge case.
        $this->loadAttributesFile();

        // Notification config — scoped so it picks up config
        // overrides made mid-request (rare but legal under Octane
        // reload flows).
        $this->app->scoped(HealthNotificationConfig::class, static function (Application $app): HealthNotificationConfig {
            /** @var ConfigRepository $config */
            $config = $app->make(ConfigRepository::class);

            return new HealthNotificationConfig($config);
        });

        // Discoverer — singleton because attribute discovery is
        // expensive to run and idempotent to reuse. Its
        // dependencies (container, notification config, logger)
        // are all singletons themselves.
        $this->app->singleton(HealthCheckDiscoverer::class, static function (Application $app): HealthCheckDiscoverer {
            /** @var Container $container */
            $container = $app;
            /** @var HealthNotificationConfig $notifications */
            $notifications = $app->make(HealthNotificationConfig::class);
            /** @var LoggerInterface $logger */
            $logger = $app->make(LoggerInterface::class);

            return new HealthCheckDiscoverer($container, $notifications, $logger);
        });
    }

    /**
     * Include the composer-attribute-collector's generated file so
     * its {@see \olvlvl\ComposerAttributeCollector\Attributes}
     * facade has a `Collection` provider registered at runtime.
     *
     * ## Why this is provider-side and not a `files` autoload entry
     *
     * A `files` autoload entry would run at
     * `require 'vendor/autoload.php'` time — before any Laravel
     * boot logic. That's technically earlier than we need, but it
     * also means every CI job / repl / cli tool that touches the
     * autoloader pays the (small) require cost regardless of
     * whether it needs attribute discovery. Doing it inside the
     * provider defers the require to the moment Laravel decides
     * to activate the health package.
     *
     * The file is generated during `composer install` +
     * `composer dump-autoload`; the plugin creates an empty stub
     * during `activate()` so `file_exists()` returns true even
     * before the real data has been dumped.
     */
    private function loadAttributesFile(): void
    {
        // Skip when the plugin isn't installed at all.
        if (! class_exists(\olvlvl\ComposerAttributeCollector\Attributes::class)) {
            return;
        }

        // Locate composer's vendor dir relative to the app's
        // base path. `base_path('vendor')` covers the standard
        // Laravel layout; consumers with an unusual composer
        // `vendor-dir` override should include the file
        // themselves in their bootstrap.
        $attributesFile = $this->app->basePath('vendor/attributes.php');

        if (file_exists($attributesFile)) {
            require_once $attributesFile;
        }
    }

    /**
     * Boot-time wiring.
     *
     * Discovery is deferred to `$this->app->booted(...)` so every
     * other package's `boot()` runs first — that ensures any
     * container bindings the discovered checks depend on are
     * available at instantiation time.
     */
    public function boot(): void
    {
        $this->registerPublishing();

        // Spatie's Health facade is optional at the composer level
        // — degrade cleanly when the app doesn't ship it.
        if (! class_exists(Health::class)) {
            return;
        }

        $this->app->booted(function (): void {
            $this->runDiscoveryAndRegister();
        });
    }

    /**
     * Execute the discovery pipeline and register every check with
     * Spatie's Health facade in one call.
     *
     * `Health::checks([])` is legal — Spatie's facade accepts an
     * empty list, so we call it unconditionally rather than
     * short-circuiting on zero discoveries. That keeps the boot
     * signal consistent: consumers can always observe that the
     * facade has been touched.
     */
    private function runDiscoveryAndRegister(): void
    {
        /** @var HealthCheckDiscoverer $discoverer */
        $discoverer = $this->app->make(HealthCheckDiscoverer::class);

        $checks = $discoverer->discover();

        Health::checks($checks);
    }

    /**
     * Register publishable resources — currently just the config
     * stub. Only registered when running in console, matching
     * Spatie's own conventions.
     */
    private function registerPublishing(): void
    {
        if (! $this->app->runningInConsole()) {
            return;
        }

        $this->publishes([
            __DIR__ . '/../../config/health.php' => $this->app->configPath('health.php'),
        ], 'health-config');
    }
}
