<?php

declare(strict_types=1);

/**
 * Example: Third-Party Base Class with AsModuleProvider.
 *
 * When you need to extend a different base class (e.g., a third-party
 * package's service provider, or Laravel's EventServiceProvider), use
 * the AsModuleProvider trait. The Application auto-detects it and
 * calls registerModule() / bootModule() automatically.
 *
 * No constructor override, no manual calls, no properties needed.
 * Module name and namespace are auto-derived from the class name.
 *
 * @category Examples
 *
 * @since    2.0.0
 */

namespace Stackra\Notifications\Providers;

use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Concerns\AsModuleProvider;
use Stackra\ServiceProvider\Contracts\HasBindings;
use Illuminate\Support\ServiceProvider as LaravelServiceProvider;

/**
 * Notification module service provider.
 *
 * Extends Laravel's base ServiceProvider directly (not the Stackra one)
 * and uses the AsModuleProvider trait for full module functionality.
 *
 * The Application auto-wires registerModule() and bootModule() — no
 * manual calls needed. Module name auto-derived as 'Notification'.
 *
 * Use #[AsModule] only when you need custom priority, dependencies, etc.
 */
#[AsModule(name: 'Notification', priority: 5)]
#[LoadsResources(config: true, commands: true, listeners: true)]
class NotificationServiceProvider extends LaravelServiceProvider implements HasBindings
{
    use AsModuleProvider;

    /**
     * Register container bindings for the notification module.
     *
     * Called automatically by registerModule() because this class
     * implements HasBindings.
     */
    public function bindings(): void
    {
        $this->app->scoped(
            NotificationServiceInterface::class,
            NotificationService::class,
        );
    }
}
