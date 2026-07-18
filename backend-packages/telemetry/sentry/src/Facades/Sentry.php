<?php

declare(strict_types=1);

/**
 * Sentry Facade.
 *
 * Provides convenient static access to the Sentry context registry
 * for registering custom context providers and managing Sentry
 * integration.
 *
 * @category Facades
 *
 * @since    1.0.0
 */

namespace Academorix\Sentry\Facades;

use Illuminate\Support\Facades\Facade;
use Academorix\Sentry\Contracts\SentryContext;
use Academorix\Sentry\Services\SentryContextRegistry;
use Sentry\State\Scope;

/**
 * Sentry Facade.
 *
 * Provides convenient access to Sentry context registry for registering
 * custom context providers and managing Sentry integration.
 *
 * ## Usage:
 *
 * ### Register Custom Context:
 * ```php
 * use Academorix\Sentry\Facades\Sentry;
 *
 * Sentry::register(new TenantContext());
 * ```
 *
 * ### Get All Registered Contexts:
 * ```php
 * $contexts = Sentry::getProviders();
 * ```
 *
 * ### Apply All Contexts to Scope:
 * ```php
 * Sentry::applyAll($scope);
 * ```
 *
 * ### Clear Manual Contexts:
 * ```php
 * Sentry::clearManual();
 * ```
 *
 * ## Available Methods:
 * - `register(SentryContext $context)` - Register a custom context provider
 * - `getProviders()` - Get all registered context providers (sorted by priority)
 * - `applyAll(Scope $scope, ?Throwable $throwable = null)` - Apply all contexts to a Sentry scope
 * - `clearManual()` - Clear manually registered contexts (useful for testing)
 *
 * @method static void  register(SentryContext $context)                      Register a custom context provider
 * @method static array getProviders()                                        Get all registered context providers
 * @method static void  applyAll(Scope $scope, ?\Throwable $throwable = null) Apply all contexts to scope
 * @method static void  clearManual()                                         Clear manually registered contexts
 *
 * @see SentryContextRegistry
 */
class Sentry extends Facade
{
    /**
     * Get the registered name of the component.
     */
    protected static function getFacadeAccessor(): string
    {
        return SentryContextRegistry::class;
    }
}
