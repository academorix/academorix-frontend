<?php

declare(strict_types=1);

/**
 * Debugbar Service Provider.
 *
 * Registers Laravel Debugbar with the Academorix module system.
 * Extends the vendor Debugbar provider and integrates via the
 * AsModuleProvider trait for module lifecycle management.
 *
 * Custom collector discovery via #[AsCollector] is handled at compile
 * time by {@see DebugbarCompiler}.
 *
 * @category Providers
 *
 * @since    1.0.0
 *
 * @see \Academorix\Debugbar\Compiler\DebugbarCompiler
 */

namespace Academorix\Debugbar\Providers;

use Barryvdh\Debugbar\ServiceProvider as BaseDebugbarServiceProvider;
use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Concerns\AsModuleProvider;
use Academorix\ServiceProvider\Contracts\ServiceProviderInterface;
use Academorix\ServiceProvider\Attributes\LoadsResources;

/**
 * Debugbar module service provider.
 *
 * Extends the vendor base provider — uses AsModuleProvider trait
 * instead of extending the Academorix ServiceProvider base class.
 *
 * Typically only enabled in local/development environments.
 */
#[AsModule(name: 'TelemetryDebugbar')]
#[LoadsResources()]
class DebugbarServiceProvider extends BaseDebugbarServiceProvider implements ServiceProviderInterface
{
    use AsModuleProvider;
}
