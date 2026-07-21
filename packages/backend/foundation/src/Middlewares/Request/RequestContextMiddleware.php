<?php

declare(strict_types=1);

/**
 * Request Context Middleware
 *
 * Request middleware that transforms or validates incoming HTTP requests.
 * Processes the request before it reaches the controller layer.
 *
 * @category Middlewares
 *
 * @since    1.0.0
 */
namespace Stackra\Foundation\Middlewares\Request;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stackra\Routing\Attributes\AsMiddleware;
use Symfony\Component\HttpFoundation\Response;

/**
 * Request Context Middleware.
 *
 * Adds request-specific context to logs for debugging and monitoring.
 * This middleware captures IP address, user agent, HTTP method, route,
 * session ID, and correlation ID to provide comprehensive request context.
 *
 * ## Context Added:
 * - ip: Client IP address (respects X-Forwarded-For)
 * - user_agent: Client user agent string
 * - method: HTTP method (GET, POST, PUT, DELETE, etc.)
 * - route: Route name or path
 * - session_id: Session identifier (if session exists)
 * - correlation_id: For distributed tracing (from X-Correlation-ID header or generated)
 *
 * ## Benefits:
 * - Track requests by IP for security analysis
 * - Identify client types (browser, mobile app, API client)
 * - Debug method-specific issues
 * - Correlate logs with specific routes
 * - Track user sessions across requests
 * - Trace requests across distributed services
 *
 * ## Distributed Tracing:
 * Clients can send X-Correlation-ID header to trace requests across services:
 * ```
 * GET /api/users
 * X-Correlation-ID: abc-123-def-456
 * ```
 *
 * If not provided, a correlation ID is generated (same as request_id).
 *
 * ## Example Log Entry:
 * ```
 * [2024-01-15 10:30:45] local.INFO: User created
 * {
 *   "request_id": "abc123",
 *   "correlation_id": "abc123",
 *   "ip": "192.168.1.100",
 *   "user_agent": "Mozilla/5.0...",
 *   "method": "POST",
 *   "route": "api.users.store",
 *   "session_id": "xyz789"
 * }
 * ```
 *
 * @since 1.0.0
 */
#[AsMiddleware(
    alias: 'request.context',
    priority: 20
)]
class RequestContextMiddleware
{
    /**
     * Handle an incoming request.
     *
     * Adds request context to logs for all subsequent log entries
     * within this request lifecycle.
     *
     * @param  Request                      $request The incoming HTTP request
     * @param  Closure(Request): (Response) $next    The next middleware in the pipeline
     * @return Response                     The HTTP response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Build context array
        $context = [
            'ip' => $request->ip(),
            'method' => $request->method(),
        ];

        // Add correlation ID for distributed tracing
        // Use X-Correlation-ID header if provided, otherwise use request_id
        $correlationId = $request->header('X-Correlation-ID');
        if ($correlationId !== null && $correlationId !== '') {
            $context['correlation_id'] = $correlationId;
        } else {
            // Fall back to request_id if it exists
            $requestId = $request->attributes->get('request_id');
            if ($requestId !== null) {
                $context['correlation_id'] = $requestId;
            }
        }

        // Add user agent if present (truncate to avoid huge logs)
        $userAgent = $request->userAgent();
        if ($userAgent !== null) {
            $context['user_agent'] = mb_substr($userAgent, 0, 200);
        }

        // Add route name or path
        $route = $request->route();
        $context['route'] = $route !== null ? $route->getName() ?? $request->path() : $request->path();

        // Add session ID if session exists
        if ($request->hasSession()) {
            $sessionId = $request->session()->getId();
            if ($sessionId !== null && $sessionId !== '') {
                $context['session_id'] = $sessionId;
            }
        }

        // Add context to all logs in this request
        Log::withContext($context);

        return $next($request);
    }
}
