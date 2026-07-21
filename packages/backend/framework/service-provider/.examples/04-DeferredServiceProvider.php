<?php

declare(strict_types=1);

/**
 * Example 4: Deferred Service Provider.
 *
 * A heavy module that is only loaded when one of its services is requested
 * from the container. This improves application boot time by deferring
 * the provider registration until it's actually needed.
 *
 * Deferred providers should:
 *   ✅ Register container bindings (singletons, interfaces)
 *   ✅ Declare provided services via getProvidedServices()
 *
 * Deferred providers should NOT:
 *   ❌ Load routes (routes must be registered at boot time)
 *   ❌ Load views or translations
 *   ❌ Register middleware
 *   ❌ Register scheduled tasks
 *
 * How it works:
 *   1. Laravel reads provides() and stores the service list
 *   2. Provider is NOT loaded during application boot
 *   3. When app->make(ReportGeneratorInterface::class) is called,
 *      Laravel loads this provider and calls register()
 *   4. The service is resolved and returned
 *
 * @category Examples
 *
 * @since    1.0.0
 */

namespace Stackra\Reporting\Providers;

use Stackra\Reporting\Contracts\ReportExporterInterface;
use Stackra\Reporting\Contracts\ReportGeneratorInterface;
use Stackra\Reporting\Services\ReportExporter;
use Stackra\Reporting\Services\ReportGenerator;
use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Contracts\HasBindings;
use Stackra\ServiceProvider\Providers\ServiceProvider;

/**
 * Reporting module service provider — deferred loading example.
 *
 * Only loaded when ReportGeneratorInterface or ReportExporterInterface
 * is resolved from the container. Disables all resource loading since
 * deferred providers should only register bindings.
 */
#[AsModule(
    name: 'Reporting',
    namespace: 'Stackra\\Reporting',
    priority: 200,
)]
#[LoadsResources(
    migrations: false,
    routes: false,
    views: false,
    translations: false,
    config: false,
    commands: false,
    seeders: false,
    publishables: false,
    middleware: false,
    observers: false,
    policies: false,
    healthChecks: false,
    listeners: false,
    macros: false,
    scheduledTasks: false,
)]
class ReportingServiceProvider extends ServiceProvider implements HasBindings
{
    /**
     * Enable deferred loading.
     *
     * This provider is only loaded when one of the services declared
     * in getProvidedServices() is requested from the container.
     */
    protected bool $defer = true;

    /**
     * Register container bindings for the reporting module.
     *
     * Called only when one of the provided services is first requested.
     */
    public function bindings(): void
    {
        $this->app->singleton(ReportGeneratorInterface::class, ReportGenerator::class);
        $this->app->singleton(ReportExporterInterface::class, ReportExporter::class);
    }

    /**
     * Declare which services trigger loading of this deferred provider.
     *
     * @return array<int, string> The service class/interface names.
     */
    protected function getProvidedServices(): array
    {
        return [
            ReportGeneratorInterface::class,
            ReportExporterInterface::class,
        ];
    }
}
