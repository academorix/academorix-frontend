<?php

declare(strict_types=1);

/**
 * Omni Term Service Provider Service Provider
 *
 * Registers bindings, event listeners, and bootstraps the Omniterm module.
 * Wires up all service container bindings required by this module.
 *
 * @category Providers
 *
 * @since    1.0.0
 */
namespace Academorix\OmniTerm\Providers;

use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Attributes\OnRegister;
use Academorix\ServiceProvider\Providers\ServiceProvider;

/**
 * OmniTerm module service provider.
 */
#[AsModule(name: 'OmniTerm', priority: 2)]
#[LoadsResources(views: true)]
class OmniTermServiceProvider extends ServiceProvider
{
    /**
     * Register views early so they're available during boot phase.
     */
    #[OnRegister]
    public function registerViews(): void
    {
        $this->loadViewsFrom(__DIR__ . '/../views', 'omniterm');
    }
}
