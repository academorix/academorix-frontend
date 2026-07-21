<?php

declare(strict_types=1);

/**
 * Abstract Service Provider
 *
 * Support class providing Service Provider utilities for the Framework module.
 * Contains helper logic used across multiple components in this module.
 *
 * @category Support
 *
 * @since    1.0.0
 */
namespace Stackra\Support;

use Stackra\ServiceProvider\Concerns\AsModuleProvider;
use Stackra\ServiceProvider\Providers\ServiceProvider as BaseServiceProvider;

/**
 * Support Service Provider.
 *
 * Convenience alias for Stackra\ServiceProvider\Providers\ServiceProvider.
 * Provides a shorter import path for module service providers.
 *
 * ## Usage
 *
 * ### Extend this class (standard modules):
 * ```php
 * use Stackra\Support\ServiceProvider;
 *
 * #[AsModule(name: 'MyModule')]
 * class MyServiceProvider extends ServiceProvider { }
 * ```
 *
 * ### Use AsModuleProvider trait (third-party bases):
 * ```php
 * use Stackra\ServiceProvider\Concerns\AsModuleProvider;
 *
 * class MyServiceProvider extends ThirdPartyServiceProvider
 * {
 *     use AsModuleProvider;
 * }
 * ```
 *
 * @see BaseServiceProvider
 * @see AsModuleProvider
 */
abstract class ServiceProvider extends BaseServiceProvider {}
