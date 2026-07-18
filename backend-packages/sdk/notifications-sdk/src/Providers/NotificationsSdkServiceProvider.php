<?php

declare(strict_types=1);

namespace Academorix\NotificationsSdk\Providers;

use Academorix\NotificationsSdk\Client\NotificationsSdk;
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
 * Root provider for `academorix/notifications-sdk`.
 *
 * Builds the Notifications service's own Saloon connector from `sdk.notifications.*`,
 * runs a discovery pass scoped to `#[AsSdkResource(service: 'notifications')]`, and
 * binds the typed {@see NotificationsSdk} client as a singleton. Kept independent
 * from the kernel's `ApiConnector` / registry singletons so per-service
 * connectors never collide on the shared container binding.
 */
#[AsModule(name: 'NotificationsSdk', priority: 100)]
#[LoadsResources()]
final class NotificationsSdkServiceProvider extends ServiceProvider
{
    /**
     * The platform service this SDK talks to — the discovery discriminator.
     */
    private const string SERVICE = 'notifications';

    /**
     * Config namespace this SDK merges + reads.
     */
    private const string CONFIG_KEY = 'sdk.notifications';

    /**
     * Merge the config bag + bind the typed client (built lazily on first
     * resolution so discovery runs after every module SDK has autoloaded).
     */
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../../config/notifications-sdk.php', self::CONFIG_KEY);

        $this->app->singleton(NotificationsSdk::class, function (Application $app): NotificationsSdk {
            $registry = new SdkResourceRegistry();

            // Fake mode: return an empty client; tests seed resources by hand.
            if ((bool) $app->make('config')->get(self::CONFIG_KEY . '.fake', false)) {
                return new NotificationsSdk($registry);
            }

            $connector = $this->buildConnector($app);
            $this->discoverInto($app, $connector, $registry);

            return new NotificationsSdk($registry);
        });
    }

    /**
     * Publish the config file for app-side overrides.
     */
    public function boot(): void
    {
        $this->publishes(
            [__DIR__ . '/../../config/notifications-sdk.php' => $this->app->configPath('notifications-sdk.php')],
            'notifications-sdk-config',
        );
    }

    /**
     * Construct this service's connector from its `sdk.notifications.*` config.
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
