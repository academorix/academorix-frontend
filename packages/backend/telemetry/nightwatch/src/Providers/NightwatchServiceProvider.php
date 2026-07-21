<?php

declare(strict_types=1);

/**
 * Nightwatch Service Provider.
 *
 * Bootstraps the Nightwatch production monitoring sub-package into
 * the Laravel application.
 *
 * Attribute-based discovery of contexts, filters, redactors, and
 * samplers is handled at compile time by {@see NightwatchCompiler}
 * — no runtime scanning in this provider.
 *
 * ## Middleware
 *
 * `NightwatchContextMiddleware` and `NightwatchSamplerMiddleware`
 * auto-register via `#[AsMiddleware]` — discovered by
 * {@see \Stackra\Routing\Providers\RoutingServiceProvider}.
 *
 * ## Registered Services (via compiler)
 * - NightwatchFilterRegistry   → singleton (immutable after boot)
 * - NightwatchRedactorRegistry → singleton (immutable after boot)
 * - NightwatchContextRegistry  → scoped (fresh per request for Octane safety)
 *
 * @category Providers
 *
 * @since    1.0.0
 *
 * @see \Stackra\Nightwatch\Compiler\NightwatchCompiler
 * @see \Stackra\Nightwatch\Registry\NightwatchContextRegistry
 * @see \Stackra\Nightwatch\Registry\NightwatchFilterRegistry
 * @see \Stackra\Nightwatch\Registry\NightwatchRedactorRegistry
 */

namespace Stackra\Nightwatch\Providers;

use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Providers\ServiceProvider;
use Stackra\ServiceProvider\Attributes\LoadsResources;

/**
 * Nightwatch module service provider.
 *
 * Priority 20 (Foundation level) — loads early so monitoring context
 * is available for all downstream events and error reports.
 */
#[AsModule(name: 'TelemetryNightwatch', priority: 20)]
#[LoadsResources()]
class NightwatchServiceProvider extends ServiceProvider {}
