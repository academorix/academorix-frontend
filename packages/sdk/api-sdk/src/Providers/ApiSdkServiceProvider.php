<?php

/**
 * @file packages/sdk/api-sdk/src/Providers/ApiSdkServiceProvider.php
 *
 * @description
 * Root service provider for `stackra/api-sdk`. Auto-discovered
 * by Laravel via `composer.json`'s `extra.laravel.providers`.
 *
 * ## What this provider does
 *
 *   1. **Merges the config** at `sdk.api.*` — every setting is
 *      env-driven; the provider seeds the config bag with the
 *      shipped defaults during the register phase.
 *
 *   2. **Binds `ApiConnector` as a `#[Singleton]`** — one shared
 *      Saloon connector instance, seeded from config. All SDK
 *      resources use this connector.
 *
 *   3. **Binds `SdkResourceRegistry` as a `#[Singleton]`** —
 *      populated once during boot; consumed for the lifetime
 *      of the worker.
 *
 *   4. **Binds `ApiClient` (or `ApiFake`) to the
 *      `ApiClientInterface` interface** — production uses the
 *      real client; tests use the fake by setting
 *      `sdk.api.fake = true`.
 *
 *   5. **Runs the discovery pass** at boot — walks
 *      `olvlvl/composer-attribute-collector` for every
 *      `#[AsSdkResource]` target, resolves each out of the
 *      container, attaches the shared connector, and registers
 *      into the registry.
 *
 * ## Publishable config
 *
 * The shipped `config/sdk-api.php` is publishable under the
 * `sdk-api-config` tag so app operators can override defaults
 * without touching env vars in a hurry.
 *
 * ## Octane safety
 *
 * Every binding is a `singleton` — resources are stateless and
 * the connector is immutable. No closure captures request-scoped
 * state.
 *
 * @see \Stackra\ApiSdk\Attributes\AsSdkResource Discovery marker.
 * @see \Stackra\ApiSdk\Registry\SdkResourceRegistry Discovery target.
 * @see \Stackra\ApiSdk\Client\ApiClient Consumer-facing facade.
 */

declare(strict_types=1);

namespace Stackra\ApiSdk\Providers;

use Stackra\ApiSdk\Attributes\AsSdkResource;
use Stackra\ApiSdk\Client\ApiClient;
use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Contracts\ApiClientInterface;
use Stackra\ApiSdk\Contracts\SdkResource;
use Stackra\ApiSdk\Enums\AuthStrategy;
use Stackra\ApiSdk\Enums\LogLevel;
use Stackra\ApiSdk\Registry\SdkResourceRegistry;
use Stackra\ApiSdk\Testing\ApiFake;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;
use Psr\Log\LoggerInterface;
use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;

/**
 * Root provider for `stackra/api-sdk`.
 */
#[AsModule(name: 'ApiSdk', priority: 100)]
#[LoadsResources()]
final class ApiSdkServiceProvider extends ServiceProvider
{
    /**
     * Register bindings. Called during Laravel's register phase
     * — no facades resolved, no discovery, no HTTP. Every
     * binding is a singleton because state is immutable per
     * instance.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(
            __DIR__ . '/../../config/sdk-api.php',
            'sdk.api',
        );

        $this->app->singleton(SdkResourceRegistry::class, static fn (): SdkResourceRegistry
            => new SdkResourceRegistry(),
        );

        $this->app->singleton(ApiConnector::class, static function (Application $app): ApiConnector {
            /** @var array{
             *     base_url: string,
             *     auth: array{strategy: string, token: ?string, header: string},
             *     timeouts: array{connect: float, request: float},
             *     retry: array{enabled: bool, max_attempts: int, base_delay_ms: int, max_delay_ms: int, respect_retry_after: bool},
             *     correlation_id: array{enabled: bool, header: string},
             *     logging: array{level: string, channel: ?string, redact: list<string>},
             *     headers: array<string, string>,
             * } $config
             */
            $config = $app->make('config')->get('sdk.api');

            // Optional logger — only wired when `sdk.api.logging.level` !== off.
            // When channel is null we fall back to the app's default logger.
            $logger = null;
            $logLevel = LogLevel::from($config['logging']['level']);
            if ($logLevel !== LogLevel::Off) {
                $channel = $config['logging']['channel'] ?? null;
                $logger  = $channel !== null && $channel !== ''
                    ? $app->make('log')->channel($channel)
                    : $app->make(LoggerInterface::class);
            }

            return new ApiConnector(
                baseUrl:               $config['base_url'],
                authStrategy:          AuthStrategy::from($config['auth']['strategy']),
                authToken:             $config['auth']['token'] ?? null,
                authHeader:            $config['auth']['header'],
                timeouts:              $config['timeouts'],
                defaultHeaders:        $config['headers'],
                retryEnabled:          $config['retry']['enabled'],
                retryMaxAttempts:      $config['retry']['max_attempts'],
                retryBaseDelayMs:      $config['retry']['base_delay_ms'],
                retryMaxDelayMs:       $config['retry']['max_delay_ms'],
                retryRespectRetryAfter: $config['retry']['respect_retry_after'],
                correlationIdEnabled:  $config['correlation_id']['enabled'],
                correlationIdHeader:   $config['correlation_id']['header'],
                logLevel:              $logLevel,
                logRedact:             $config['logging']['redact'],
                logger:                $logger,
            );
        });

        $this->app->singleton(ApiClientInterface::class, static function (Application $app): ApiClientInterface {
            /** @var bool $fake */
            $fake = (bool) $app->make('config')->get('sdk.api.fake', false);
            if ($fake) {
                return new ApiFake();
            }

            return new ApiClient($app->make(SdkResourceRegistry::class));
        });

        // Alias so consumers can also type-hint the concrete class.
        $this->app->alias(ApiClientInterface::class, ApiClient::class);
    }

    /**
     * Publish the config file + run resource discovery.
     */
    public function boot(): void
    {
        $this->publishes(
            [__DIR__ . '/../../config/sdk-api.php' => $this->app->configPath('sdk-api.php')],
            'sdk-api-config',
        );

        if ((bool) $this->app->make('config')->get('sdk.api.discovery.enabled', true)) {
            $this->discoverResources();
        }
    }

    /**
     * Walk `olvlvl/composer-attribute-collector` for every
     * `#[AsSdkResource]` target, resolve each out of the
     * container, attach the shared connector, and register into
     * the registry (respecting priority order).
     *
     * ## Failure mode
     *
     * When the collector index is absent (fresh install, no
     * `composer dump-autoload` yet), the pass is a no-op — the
     * registry stays empty and consumer calls throw
     * `ResourceNotFoundException` with a clear diagnostic
     * message.
     *
     * When a resource throws during instantiation (misconfigured
     * dependency), the exception propagates — a discovery
     * failure is a boot failure and MUST be visible.
     */
    private function discoverResources(): void
    {
        // Reference by string so the SDK loads even when the
        // collector plugin isn't installed (yet). At runtime the
        // class is present after `composer dump-autoload`.
        $collectorClass = '\\Composer\\Attribute\\Collection';
        if (! class_exists($collectorClass)) {
            return;
        }

        // Skip discovery entirely when the fake is bound —
        // resources for the fake are seeded by the test's
        // `stub()` calls, not by discovery.
        if ((bool) $this->app->make('config')->get('sdk.api.fake', false)) {
            return;
        }

        /** @var SdkResourceRegistry $registry */
        $registry = $this->app->make(SdkResourceRegistry::class);

        /** @var ApiConnector $connector */
        $connector = $this->app->make(ApiConnector::class);

        /**
         * @var iterable<object{ name: class-string, attribute: AsSdkResource }> $targets
         */
        $targets = $collectorClass::findTargetClasses(AsSdkResource::class);

        foreach ($targets as $target) {
            $attribute = $target->attribute;
            if (! $attribute->enabled) {
                continue;
            }

            $class = $target->name;
            if (! is_subclass_of($class, SdkResource::class)) {
                // Silently skip mis-tagged classes; a PHPStan
                // rule catches this at analysis time.
                continue;
            }

            /** @var SdkResource $resource */
            $resource = $this->app->make($class);
            $resource->attachConnector($connector);

            $registry->register($attribute->name, $resource, $attribute->priority);
        }

        $registry->sortByPriority();
    }
}
