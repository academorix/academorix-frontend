<?php

declare(strict_types=1);

namespace Academorix\PlatformSdk\Providers;

use Academorix\PlatformSdk\Client\PlatformSdk;
use Academorix\ApiSdk\Attributes\AsSdkResource;
use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Contracts\SdkResource;
use Academorix\ApiSdk\Enums\AuthStrategy;
use Academorix\ApiSdk\Enums\LogLevel;
use Academorix\ApiSdk\Registry\SdkResourceRegistry;
use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;
use Psr\Log\LoggerInterface;

/**
 * Root provider for `academorix/platform-sdk`.
 *
 * Builds the Platform service's own Saloon connector from `sdk.platform.*`,
 * runs a discovery pass scoped to `#[AsSdkResource(service: 'platform')]`, and
 * binds the typed {@see PlatformSdk} client as a singleton. Kept independent
 * from the kernel's `ApiConnector` / registry singletons so per-service
 * connectors never collide on the shared container binding.
 */
#[AsModule(name: 'PlatformSdk', priority: 100)]
#[LoadsResources()]
final class PlatformSdkServiceProvider extends ServiceProvider
{
    /**
     * The platform service this SDK talks to — the discovery discriminator.
     */
    private const string SERVICE = 'platform';

    /**
     * Config namespace this SDK merges + reads.
     */
    private const string CONFIG_KEY = 'sdk.platform';

    /**
     * Merge the config bag + bind the typed client (built lazily on first
     * resolution so discovery runs after every module SDK has autoloaded).
     */
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../../config/platform-sdk.php', self::CONFIG_KEY);

        $this->app->singleton(PlatformSdk::class, function (Application $app): PlatformSdk {
            $registry = new SdkResourceRegistry();

            // Fake mode: return an empty client; tests seed resources by hand.
            if ((bool) $app->make('config')->get(self::CONFIG_KEY . '.fake', false)) {
                return new PlatformSdk($registry);
            }

            $connector = $this->buildConnector($app);
            $this->discoverInto($app, $connector, $registry);

            return new PlatformSdk($registry);
        });
    }

    /**
     * Publish the config file for app-side overrides.
     */
    public function boot(): void
    {
        $this->publishes(
            [__DIR__ . '/../../config/platform-sdk.php' => $this->app->configPath('platform-sdk.php')],
            'platform-sdk-config',
        );
    }

    /**
     * Construct this service's connector from its `sdk.platform.*` config.
     */
    private function buildConnector(Application $app): ApiConnector
    {
        /** @var array<string, mixed> $c */
        $c = $app->make('config')->get(self::CONFIG_KEY);

        // Optional logger — only wired when the level is not `off`.
        $logger   = null;
        $logLevel = LogLevel::from($c['logging']['level']);
        if ($logLevel !== LogLevel::Off) {
            $channel = $c['logging']['channel'] ?? null;
            $logger  = $channel !== null && $channel !== ''
                ? $app->make('log')->channel($channel)
                : $app->make(LoggerInterface::class);
        }

        return new ApiConnector(
            baseUrl:                $c['base_url'],
            authStrategy:           AuthStrategy::from($c['auth']['strategy']),
            authToken:              $c['auth']['token'] ?? null,
            authHeader:             $c['auth']['header'],
            timeouts:               $c['timeouts'],
            defaultHeaders:         $c['headers'],
            retryEnabled:           $c['retry']['enabled'],
            retryMaxAttempts:       $c['retry']['max_attempts'],
            retryBaseDelayMs:       $c['retry']['base_delay_ms'],
            retryMaxDelayMs:        $c['retry']['max_delay_ms'],
            retryRespectRetryAfter: $c['retry']['respect_retry_after'],
            correlationIdEnabled:   $c['correlation_id']['enabled'],
            correlationIdHeader:    $c['correlation_id']['header'],
            logLevel:               $logLevel,
            logRedact:              $c['logging']['redact'],
            logger:                 $logger,
        );
    }

    /**
     * Discover every `#[AsSdkResource(service: self::SERVICE)]`, attach this
     * service's connector, and register it into `$registry`.
     *
     * No-ops when the composer-attribute-collector index is absent (fresh
     * install before `composer dump-autoload`).
     */
    private function discoverInto(Application $app, ApiConnector $connector, SdkResourceRegistry $registry): void
    {
        $collectorClass = '\\Composer\\Attribute\\Collection';
        if (! class_exists($collectorClass)) {
            return;
        }

        /** @var iterable<object{name: class-string, attribute: AsSdkResource}> $targets */
        $targets = $collectorClass::findTargetClasses(AsSdkResource::class);

        foreach ($targets as $target) {
            $attribute = $target->attribute;

            // Only this service's resources — the discriminator that lets one
            // connector map to exactly one service surface.
            if (! $attribute->enabled || $attribute->service !== self::SERVICE) {
                continue;
            }

            $class = $target->name;
            if (! is_subclass_of($class, SdkResource::class)) {
                continue;
            }

            /** @var SdkResource $resource */
            $resource = $app->make($class);
            $resource->attachConnector($connector);

            $registry->register($attribute->name, $resource, $attribute->priority);
        }

        $registry->sortByPriority();
    }
}
