<?php

declare(strict_types=1);

/**
 * Debugbar Service Provider.
 *
 * Registers Laravel Debugbar with the Stackra module system.
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
 * @see \Stackra\Debugbar\Compiler\DebugbarCompiler
 */

namespace Stackra\Debugbar\Providers;

use Barryvdh\Debugbar\ServiceProvider as BaseDebugbarServiceProvider;
use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Concerns\AsModuleProvider;
use Stackra\ServiceProvider\Contracts\ServiceProviderInterface;
use Stackra\ServiceProvider\Attributes\LoadsResources;

/**
 * Debugbar module service provider.
 *
 * Extends the vendor base provider — uses AsModuleProvider trait
 * instead of extending the Stackra ServiceProvider base class.
 *
 * Typically only enabled in local/development environments.
 */
#[AsModule(name: 'TelemetryDebugbar')]
#[LoadsResources()]
class DebugbarServiceProvider extends BaseDebugbarServiceProvider implements ServiceProviderInterface
{
    use AsModuleProvider;
}
