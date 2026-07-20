<?php


/**
 * Force Json Response Middleware
 *
 * Request middleware that transforms or validates incoming HTTP requests.
 * Processes the request before it reaches the controller layer.
 *
 * @category Middlewares
 *
 * @since    1.0.0
 */
namespace Academorix\Foundation\Middlewares\Request;

use Closure;
use Illuminate\Http\Request;
use Academorix\Routing\Attributes\AsMiddleware;
use Symfony\Component\HttpFoundation\Response;

/**
 * Force JSON Response Middleware.
 *
 * Ensures all API responses are returned as JSON by setting the Accept header
 * to application/json for all incoming requests. This is essential for API-only
 * applications to maintain consistent response formats.
 *
 * ## Purpose:
 * - Forces JSON responses even if client doesn't send Accept: application/json
 * - Prevents HTML error pages from being returned
 * - Ensures consistent API response format
 * - Simplifies client-side error handling
 *
 * ## How It Works:
 * 1. Intercepts incoming request
 * 2. Overrides Accept header to application/json
 * 3. Laravel's exception handler respects this header
 * 4. All responses (including errors) are JSON
 *
 * ## Benefits:
 * - **Consistency**: All responses are JSON, never HTML
 * - **Client-Friendly**: Easier to parse responses
 * - **Error Handling**: Exceptions return JSON instead of HTML
 * - **API Standards**: Follows REST API best practices
 *
 * ## Example:
 * ```
 * // Without middleware:
 * GET /api/users
 * Accept: text/html
 * Response: <html>...</html> (HTML error page)
 *
 * // With middleware:
 * GET /api/users
 * Accept: text/html (overridden to application/json)
 * Response: {"success": false, "message": "..."} (JSON)
 * ```
 *
 * @since 1.0.0
 */
#[AsMiddleware(
    alias: 'force.json',
    groups: ['api'],
    priority: 65
)]
class ForceJsonResponse
{
    /**
     * Handle an incoming request.
     *
     * Forces the Accept header to application/json to ensure all responses
     * are returned in JSON format, including error responses.
     *
     * @param  Request                      $request The incoming HTTP request
     * @param  Closure(Request): (Response) $next    The next middleware in the pipeline
     * @return Response                     The HTTP response (guaranteed to be JSON)
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Override the Accept header to force JSON responses
        // This ensures Laravel's exception handler returns JSON instead of HTML
        $request->headers->set('Accept', 'application/json');

        // Process the request through the rest of the middleware stack
        return $next($request);
    }
}
