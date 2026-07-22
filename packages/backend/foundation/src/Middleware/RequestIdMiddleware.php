<?php

declare(strict_types=1);

/**
 * Request Id Middleware
 *
 * Request middleware that transforms or validates incoming HTTP requests.
 * Processes the request before it reaches the controller layer.
 *
 * @category Middleware
 *
 * @since    1.0.0
 */
namespace Stackra\Foundation\Middleware;

use Closure;
use Illuminate\Container\Attributes\Config;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stackra\Routing\Attributes\AsMiddleware;
use Stackra\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Request ID Middleware.
 *
 * Generates and adds a unique request ID to every request and response.
 * This is useful for request tracing, logging, and debugging across
 * distributed systems.
 *
 * ## Features:
 * - Generates unique request ID (UUID v4)
 * - Adds X-Request-ID header to responses
 * - Preserves existing request ID if provided
 * - Stores request ID in request attributes
 * - Useful for distributed tracing
 *
 * ## Configuration:
 *
 * Set in `.env`:
 * ```env
 * APP_REQUEST_ID_HEADER=X-Request-ID
 * ```
 *
 * ## Usage:
 *
 * ### Global Middleware:
 * ```php
 * // In app/Http/Kernel.php
 * protected $middleware = [
 *     \Stackra\Foundation\Middleware\RequestIdMiddleware::class,
 * ];
 * ```
 *
 * ### Route Middleware:
 * ```php
 * // In app/Http/Kernel.php
 * protected $middlewareAliases = [
 *     'request.id' => \Stackra\Foundation\Middleware\RequestIdMiddleware::class,
 * ];
 * ```
 *
 * ### Access Request ID:
 * ```php
 * // In controller or service
 * $requestId = request()->header('X-Request-ID');
 *
 * // In logs
 * logger()->info('Processing request', ['request_id' => request()->header('X-Request-ID')]);
 * ```
 *
 * ### Example Headers:
 * ```
 * Request:
 * X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
 *
 * Response:
 * X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
 * ```
 *
 * @category   Middleware
 *
 * @since      1.0.0
 */
#[AsMiddleware(
    alias: 'request.id',
    priority: 15
)]
class RequestIdMiddleware
{
    /**
     * Default request ID header name.
     */
    protected const DEFAULT_HEADER = 'X-Request-ID';

    /**
     * Create a new middleware instance.
     *
     * @param string $headerName Request ID header name
     */
    public function __construct(
        #[Config('app.request_id_header')]
        protected string $headerName = self::DEFAULT_HEADER,
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  Request  $request The incoming request
     * @param  Closure  $next    The next middleware
     * @return Response The response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if request already has a request ID
        $requestId = $request->header($this->headerName);

        // Generate a new request ID if not provided
        if (empty($requestId)) {
            $requestId = (string) Str::uuid();
        }

        // Store request ID in request attributes for later access
        $request->attributes->set('request_id', $requestId);

        // Add request ID to request headers
        $request->headers->set($this->headerName, $requestId);

        // Add request ID to log context for all subsequent logs
        Log::withContext([
            'request_id' => $requestId,
        ]);

        /** @var Response $response */
        $response = $next($request);

        // Add request ID to response headers
        $response->headers->set($this->headerName, $requestId);

        return $response;
    }
}
