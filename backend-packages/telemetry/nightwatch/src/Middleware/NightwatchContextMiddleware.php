<?php

declare(strict_types=1);

/**
 * Nightwatch Context Middleware.
 *
 * Applies all discovered Nightwatch context providers to the current
 * request via `Context::add()`. Runs early in the middleware stack
 * (priority 1) so context data is available for all downstream events
 * captured by Nightwatch.
 *
 * Registered automatically via the #[AsMiddleware] attribute — no
 * manual `$router->aliasMiddleware()` or `pushMiddlewareToGroup()`
 * calls needed.
 *
 * @category Middleware
 *
 * @since    1.0.0
 *
 * @see \Academorix\Nightwatch\Registry\NightwatchContextRegistry
 */

namespace Academorix\Nightwatch\Middleware;

use Closure;
use Illuminate\Http\Request;
use Academorix\Nightwatch\Registry\NightwatchContextRegistry;
use Academorix\Routing\Attributes\AsMiddleware;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware that applies all Nightwatch context providers.
 *
 * Usage via alias:
 *   Route::middleware('nightwatch.context')->group(fn () => ...);
 *
 * Auto-applied to both 'api' and 'web' groups via attribute.
 */
#[AsMiddleware(
    alias: 'nightwatch.context',
    groups: ['api', 'web'],
    priority: 1,
)]
class NightwatchContextMiddleware
{
    /**
     * Create a new middleware instance.
     *
     * @param NightwatchContextRegistry $registry The scoped context registry.
     */
    public function __construct(
        protected NightwatchContextRegistry $registry,
    ) {}

    /**
     * Handle an incoming request.
     *
     * Applies all registered context providers via the registry's
     * `applyAll()` method, which calls `Context::add()` for each
     * provider in priority order.
     *
     * @param  Request $request The incoming HTTP request.
     * @param  Closure $next    The next middleware in the pipeline.
     * @return Response The HTTP response.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $this->registry->applyAll();

        return $next($request);
    }
}
