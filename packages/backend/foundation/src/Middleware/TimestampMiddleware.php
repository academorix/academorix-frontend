<?php

declare(strict_types=1);

/**
 * Timestamp Middleware
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

use function in_array;
use function microtime;
use function now;

use Stackra\Routing\Attributes\AsMiddleware;
use Stackra\Support\Str;
use Symfony\Component\HttpFoundation\Response;

use function time;

/**
 * Timestamp Middleware.
 *
 * Adds server timestamp headers to all responses.
 * Useful for debugging, monitoring, and time synchronization.
 *
 * ## Features:
 * - Adds X-Timestamp header (Unix timestamp)
 * - Adds X-Timestamp-ISO header (ISO 8601 format)
 * - Adds X-Response-Time header (request processing time in ms)
 * - Configurable timestamp formats
 * - Lightweight and performant
 *
 * ## Configuration:
 *
 * Set in `.env`:
 * ```env
 * APP_TIMESTAMP_ENABLED=true
 * APP_TIMESTAMP_FORMAT=unix  # unix, iso, both
 * APP_RESPONSE_TIME_ENABLED=true
 * ```
 *
 * ## Usage:
 *
 * ### Global Middleware:
 * ```php
 * // In app/Http/Kernel.php
 * protected $middleware = [
 *     \Stackra\Foundation\Middleware\TimestampMiddleware::class,
 * ];
 * ```
 *
 * ### Route Middleware:
 * ```php
 * // In app/Http/Kernel.php
 * protected $middlewareAliases = [
 *     'timestamp' => \Stackra\Foundation\Middleware\TimestampMiddleware::class,
 * ];
 * ```
 *
 * ### Example Response Headers:
 * ```
 * X-Timestamp: 1704067200
 * X-Timestamp-ISO: 2024-01-01T00:00:00+00:00
 * X-Response-Time: 45.23ms
 * ```
 *
 * @category   Middleware
 *
 * @since      1.0.0
 */
#[AsMiddleware(
    alias: 'timestamp',
    priority: 90
)]
class TimestampMiddleware
{
    /**
     * Create a new middleware instance.
     *
     * @param bool   $timestampEnabled    Whether timestamp headers are enabled
     * @param string $timestampFormat     The timestamp format (unix, iso, both)
     * @param bool   $responseTimeEnabled Whether response time header is enabled
     */
    public function __construct(
        #[Config('app.timestamp_enabled', true)]
        private readonly bool $timestampEnabled,
        #[Config('app.timestamp_format', 'both')]
        private readonly string $timestampFormat,
        #[Config('app.response_time_enabled', true)]
        private readonly bool $responseTimeEnabled,
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
        // Record start time for response time calculation
        $startTime = microtime(true);

        /** @var Response $response */
        $response = $next($request);

        // Check if timestamp is enabled
        if (! $this->timestampEnabled) {
            return $response;
        }

        // Add Unix timestamp
        if (in_array($this->timestampFormat, ['unix', 'both'], true)) {
            $response->headers->set('X-Timestamp', (string) time());
        }

        // Add ISO 8601 timestamp
        if (in_array($this->timestampFormat, ['iso', 'both'], true)) {
            $response->headers->set('X-Timestamp-ISO', now()->toIso8601String());
        }

        // Add response time if enabled
        if ($this->responseTimeEnabled) {
            $endTime = microtime(true);
            $responseTime = ($endTime - $startTime) * 1000;  // Convert to milliseconds
            $response->headers->set('X-Response-Time', Str::format('%.2fms', $responseTime));
        }

        return $response;
    }
}
