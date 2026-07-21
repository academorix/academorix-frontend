<?php

declare(strict_types=1);

namespace Stackra\Settings\Providers;

use Stackra\Scope\Contracts\ScopeRegistryInterface;
use Stackra\Scope\Data\ScopeConsumerConfig;
use Stackra\Settings\Bootstrappers\SettingsBootstrapper;
use Stackra\Settings\Events\SettingsChangeEvent;
use Stackra\Settings\Listeners\WriteSettingsChangeToActivity;
use Stackra\Settings\Listeners\WriteSettingsChangeToAudit;
use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Attributes\OnBoot;
use Stackra\ServiceProvider\Providers\ServiceProvider;
use Illuminate\Contracts\Events\Dispatcher as EventDispatcher;

/**
 * Root service provider for `stackra/settings`.
 *
 * Ships three things:
 *
 *   1. The `SettingsBootstrapper` — Category-1 discovery for
 *      every `#[AsSetting]` class, hydrating the registry at
 *      boot.
 *   2. A boot-time registration of the `settings` namespace with
 *      the shared `ScopeRegistry`. The substrate uses that
 *      binding to validate every write + resolve default values
 *      on a total cache miss.
 *   3. Two event listeners subscribed to `SettingsChangeEvent`
 *      — one writes to `activity_log` (product feed), one to
 *      `audits` (compliance trail). Both fire unconditionally;
 *      slim deployments that don't want both sinks remove the
 *      subscription in their own `EventServiceProvider`.
 *
 * The package ships zero user-facing config. Hierarchy is scope's
 * concern, broadcasting is baked into the shipped event, audit is
 * baked into the shipped listeners.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Settings', priority: 60)]
#[LoadsResources]
final class SettingsServiceProvider extends ServiceProvider
{
    /**
     * Bootstrappers this module ships. Registered with the shared
     * `BootstrapperRegistry` during `registerModule()`.
     *
     * @var list<class-string<\Stackra\ServiceProvider\Bootstrappers\AbstractBootstrapper>>
     */
    protected array $bootstrappers = [
        SettingsBootstrapper::class,
    ];

    /**
     * Register the `settings` namespace with the scope substrate
     * + wire both audit-sink listeners.
     */
    #[OnBoot]
    protected function registerScopeConsumer(): void
    {
        /** @var ScopeRegistryInterface $registry */
        $registry = $this->app->make(ScopeRegistryInterface::class);

        $registry->consumer('settings', new ScopeConsumerConfig(
            defaultValueFactory: null,
            validator: null,
        ));
    }

    /**
     * Wire both audit-sink listeners to `SettingsChangeEvent`.
     * The shipped listeners are always on — dual-write is the
     * package's audit contract, not a configuration knob.
     */
    #[OnBoot]
    protected function registerAuditSinkListeners(): void
    {
        /** @var EventDispatcher $events */
        $events = $this->app->make(EventDispatcher::class);

        $events->listen(
            SettingsChangeEvent::class,
            [WriteSettingsChangeToActivity::class, 'handle'],
        );

        $events->listen(
            SettingsChangeEvent::class,
            [WriteSettingsChangeToAudit::class, 'handle'],
        );
    }
}
