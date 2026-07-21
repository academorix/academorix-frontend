<?php

declare(strict_types=1);

/**
 * Sentry Context Middleware.
 *
 * Configures the Sentry scope for each request with user and request
 * context, and adds breadcrumbs to track the request/response flow.
 *
 * Registered automatically via the #[AsMiddleware] attribute to the
 * 'api' middleware group. Apply to 'web' routes manually if needed.
 *
 * @category Middleware
 *
 * @since    1.0.0
 *
 * @see \Stackra\Sentry\Services\SentryService
 */

namespace Stackra\Sentry\Middleware;

use Closure;
use Illuminate\Http\Request;
use Stackra\Routing\Attributes\AsMiddleware;
use Stackra\Sentry\Services\SentryService;
use Stackra\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware that enriches Sentry scope with request context.
 *
 * Adds:
 * - User context (if authenticated)
 * - Request context (URL, method, IP, etc.)
 * - Request breadcrumb (before processing)
 * - Response breadcrumb (after processing)
 */
#[AsMiddleware(
    alias: 'sentry',
    groups: ['api'],
    priority: 2,
)]
class SentryContext
{
    /**
     * Handle an incoming request.
     *
     * Configures the Sentry scope, adds a request breadcrumb before
     * processing, and adds a response breadcrumb after processing.
     *
     * @param  Request $request The incoming HTTP request.
     * @param  Closure $next    The next middleware in the pipeline.
     * @return Response The HTTP response.
     */
    public function handle(Request $request, Closure $next): Response
    {
        SentryService::configureScope();

        SentryService::addBreadcrumb(
            message: Str::format('%s %s', $request->method(), $request->path()),
            data: [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'ip' => $request->ip(),
                'request_id' => $request->header('X-Request-ID'),
            ],
            category: 'request',
            level: 'info'
        );

        $response = $next($request);

        SentryService::addBreadcrumb(
            message: Str::format('Response: %d', $response->getStatusCode()),
            data: [
                'status_code' => $response->getStatusCode(),
                'content_type' => $response->headers->get('Content-Type'),
            ],
            category: 'response',
            level: $response->isSuccessful() ? 'info' : 'warning'
        );

        return $response;
    }
}
