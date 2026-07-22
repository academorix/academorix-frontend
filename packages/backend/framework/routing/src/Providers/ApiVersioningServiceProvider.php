<?php

declare(strict_types=1);

/**
 * @file packages/routing/src/Providers/ApiVersioningServiceProvider.php
 *
 * @description
 * Package entry point for the API-versioning subsystem inside
 * `stackra/routing`. Ships alongside the existing
 * {@see RoutingServiceProvider} rather than replacing it — the
 * versioning concern is self-contained and shouldn't force a
 * refactor of the broader routing wiring.
 *
 * ## Zero-body bindings (ADR 0006)
 *
 * Every concrete service in this subsystem carries a container
 * attribute:
 *
 *   - {@see \Stackra\Routing\Services\VersionComparator} —
 *     `#[Singleton]` (stateless).
 *   - {@see \Stackra\Routing\Registry\ApiVersionRegistry} —
 *     `#[Scoped]` (per-request state).
 *   - {@see \Stackra\Routing\Middleware\DetectApiVersion} —
 *     transient (default) with `#[Config('api-versioning')]`
 *     on its payload param.
 *
 * The middleware alias `api.version` is registered by
 * {@see \Stackra\Routing\Providers\RoutingServiceProvider}
 * via the `#[AsMiddleware(alias: 'api.version')]` attribute on
 * {@see DetectApiVersion} — no per-provider alias wiring needed.
 *
 * ## Responsibilities
 *
 *   1. Merge `config/api-versioning.php` under the
 *      `api-versioning.*` key of the host app's config store.
 *   2. Publish the config file under the `api-versioning-config`
 *      tag so operators can override defaults per environment.
 *
 * ## What this provider deliberately does NOT do
 *
 *   - Does not push the middleware onto any middleware group. The
 *     alias is registered but attaching it is the app's decision
 *     — some apps want it on `api`, others on a dedicated
 *     `api.versioned` group.
 *   - Does not add response-side header emission. That will be a
 *     follow-up middleware / response macro built once we've had
 *     the first version of the detector shaken out in production.
 *
 * ## Octane safety
 *
 * Every binding is either stateless singleton, per-request scoped,
 * or transient. The middleware itself is transient because it
 * captures the request-scoped `ApiVersionRegistry` at construction
 * — Laravel resolves fresh middleware instances per pipeline
 * assembly, so scoped state stays isolated per request.
 */

namespace Stackra\Routing\Providers;

use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\OnBoot;
use Stackra\ServiceProvider\Attributes\OnRegister;
use Stackra\ServiceProvider\Providers\ServiceProvider;

/**
 * Wires the API-versioning subsystem into the host application.
 *
 * `#[LoadsResources]` is present with defaults (all flags false)
 * — this package doesn't ship views / translations / migrations
 * under the conventional paths. All wiring is declarative via
 * container attributes on the concrete classes.
 */
#[AsModule(name: 'ApiVersioning', priority: 40)]
#[LoadsResources()]
final class ApiVersioningServiceProvider extends ServiceProvider
{
    /**
     * Merge the package's default configuration under
     * `api-versioning.*` at register time.
     *
     * ## Why priority 10
     *
     * Config merge must precede any resolution that reads the
     * config — including the middleware's `#[Config]` snapshot
     * on its constructor. Priority 10 sorts this ahead of the
     * default-100 hook dispatch.
     */
    #[OnRegister(priority: 10)]
    protected function mergeConfig(): void
    {
        $this->mergeConfigFrom(
            __DIR__ . '/../../config/api-versioning.php',
            'api-versioning',
        );
    }

    /**
     * Publish the config so ops can override per environment —
     * invoked at boot time.
     *
     * Publishing is a boot-phase concern because the `$publishes`
     * static map is drained by the `vendor:publish` artisan
     * command, which runs after the framework has completed its
     * boot sequence.
     */
    #[OnBoot(priority: 100)]
    protected function publishConfig(): void
    {
        $this->publishes([
            __DIR__ . '/../../config/api-versioning.php' => $this->app->configPath('api-versioning.php'),
        ], 'api-versioning-config');
    }
}
