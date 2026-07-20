<?php

declare(strict_types=1);

/**
 * Service Provider Interface.
 *
 * Defines the contract for module service providers in the Academorix
 * ecosystem. All module service providers should implement this contract
 * either by extending the base ServiceProvider class or by using the
 * AsModuleProvider trait.
 *
 * @category Contracts
 *
 * @since    1.0.0
 */

namespace Academorix\ServiceProvider\Contracts;

/**
 * Contract for module service providers.
 *
 * Ensures consistent boot/register behavior across all module providers.
 */
interface ServiceProviderInterface
{
    /**
     * Bootstrap any application services.
     *
     * Called after all service providers have been registered. Performs
     * resource loading, discovery, publishing, and hook dispatch.
     */
    public function boot(): void;

    /**
     * Register any application services.
     *
     * Called during the registration phase before boot(). Binds services,
     * repositories, and other classes into the container.
     */
    public function register();
}
