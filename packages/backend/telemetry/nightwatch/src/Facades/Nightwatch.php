<?php

declare(strict_types=1);

/**
 * Nightwatch Facade.
 *
 * Provides convenient static access to the Nightwatch context registry
 * for registering context providers and applying context data.
 *
 * @category Facades
 *
 * @since    1.0.0
 */

namespace Academorix\Nightwatch\Facades;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Facade;
use Academorix\Nightwatch\Contracts\NightwatchContext;
use Academorix\Nightwatch\Registry\NightwatchContextRegistry;

/**
 * Nightwatch Facade.
 *
 * Provides convenient access to the Nightwatch context registry.
 *
 * @method static void                          register(NightwatchContext $context) Register a context provider
 * @method static Collection<int, NightwatchContext> getProviders()                 Get all registered providers
 * @method static void                          applyAll()                          Apply all contexts via Context::add()
 * @method static void                          clearManual()                       Clear manually registered contexts
 *
 * @see NightwatchContextRegistry
 */
class Nightwatch extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return NightwatchContextRegistry::class;
    }
}
