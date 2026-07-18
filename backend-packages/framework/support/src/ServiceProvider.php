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
namespace Academorix\Support;

use Academorix\ServiceProvider\Concerns\AsModuleProvider;
use Academorix\ServiceProvider\Providers\ServiceProvider as BaseServiceProvider;

/**
 * Support Service Provider.
 *
 * Convenience alias for Academorix\ServiceProvider\Providers\ServiceProvider.
 * Provides a shorter import path for module service providers.
 *
 * ## Usage
 *
 * ### Extend this class (standard modules):
 * ```php
 * use Academorix\Support\ServiceProvider;
 *
 * #[AsModule(name: 'MyModule')]
 * class MyServiceProvider extends ServiceProvider { }
 * ```
 *
 * ### Use AsModuleProvider trait (third-party bases):
 * ```php
 * use Academorix\ServiceProvider\Concerns\AsModuleProvider;
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
