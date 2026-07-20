<?php

declare(strict_types=1);

/**
 * Example 9: Listening to Module Lifecycle Events.
 *
 * Shows how to listen to lifecycle events fired by module service providers.
 * Every module fires four events during its lifecycle:
 *
 *   1. module.registering — start of register() phase
 *   2. module.registered  — end of register() phase
 *   3. module.booting     — start of boot() phase
 *   4. module.booted      — end of boot() phase
 *
 * Each event includes module context data:
 *   [
 *       'module'    => 'Tenancy',
 *       'namespace' => 'Academorix\\Tenancy',
 *       'path'      => '/var/www/packages/tenancy',
 *   ]
 *
 * Use cases:
 *   - Logging module load times for performance monitoring
 *   - Triggering actions after a specific module boots
 *   - Building a module dependency graph
 *   - Debugging module loading order
 *
 * @category Examples
 *
 * @since    1.0.0
 */

namespace Academorix\Core\Providers;

use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Enums\ModuleLifecycleEvent;
use Academorix\ServiceProvider\Providers\ServiceProvider;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;

/**
 * Core module service provider — lifecycle events example.
 *
 * Registers listeners for module lifecycle events to log module
 * loading times and trigger cross-module actions.
 */
#[AsModule(
    name: 'Core',
    namespace: 'Academorix\\Core',
    priority: 1,
)]
class CoreServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap the core module.
     *
     * Registers lifecycle event listeners after the standard boot sequence.
     */
    #[\Override]
    public function boot(): void
    {
        parent::boot();

        // Listen to ALL module booting events for performance logging
        Event::listen(ModuleLifecycleEvent::BOOTING->value, function (array $data): void {
            Log::debug("Module [{$data['module']}] is booting...", $data);
        });

        // Listen to ALL module booted events for performance logging
        Event::listen(ModuleLifecycleEvent::BOOTED->value, function (array $data): void {
            Log::debug("Module [{$data['module']}] has booted.", $data);
        });

        // Listen for a SPECIFIC module's booted event
        Event::listen(ModuleLifecycleEvent::BOOTED->value, function (array $data): void {
            if ($data['module'] === 'Tenancy') {
                // Tenancy module is now fully booted — safe to use its services
                Log::info('Tenancy module is ready. Initializing cross-module integrations.');
            }
        });

        // Listen to registration events for debugging load order
        Event::listen(ModuleLifecycleEvent::REGISTERING->value, function (array $data): void {
            Log::debug("Module [{$data['module']}] is registering...", [
                'namespace' => $data['namespace'],
            ]);
        });
    }
}
