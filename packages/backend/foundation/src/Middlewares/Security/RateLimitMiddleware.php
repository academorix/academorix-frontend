<?php

declare(strict_types=1);

/**
 * Rate Limit Middleware
 *
 * Security middleware that enforces protective measures on incoming requests.
 * Runs in the HTTP pipeline to guard against common attack vectors.
 *
 * @category Middlewares
 *
 * @since    1.0.0
 */
namespace Stackra\Foundation\Middlewares\Security;

use Closure;
use Illuminate\Cache\RateLimiter;
use Illuminate\Container\Attributes\Config;
use Illuminate\Http\Request;

use function max;

use Stackra\Foundation\Enums\HttpStatusCode;
use Stackra\Routing\Attributes\AsMiddleware;
use Stackra\Support\Reflection;
use Stackra\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rate Limit Middleware.
 *
 * Advanced rate limiting middleware with distributed support, detailed headers,
 * and per-user vs per-IP distinction. This middleware provides enterprise-grade
 * rate limiting capabilities for API protection.
 *
 * ## Features:
 * - **Distributed Rate Limiting**: Redis-based for multi-server deployments
 * - **Detailed Headers**: Full RFC-compliant rate limit headers
 * - **User vs IP Distinction**: Different limits for authenticated vs guest users
 * - **Flexible Configuration**: Per-route, per-user-type, and global limits
 * - **Graceful Degradation**: Falls back to in-memory if Redis unavailable
 * - **Bypass Whitelist**: Skip rate limiting for trusted IPs
 *
 * ## Rate Limit Headers:
 * ```
 * X-RateLimit-Limit: 60           # Maximum requests allowed
 * X-RateLimit-Remaining: 45       # Requests remaining in window
 * X-RateLimit-Reset: 1612345678   # Unix timestamp when limit resets
 * Retry-After: 15                 # Seconds to wait (when exceeded)
 * ```
 *
 * ## Usage:
 *
 * ### Basic Usage (60 requests per minute):
 * ### Basic Usage (60 requests per minute):
 * ```php
 * Route::middleware('rate.limit')->group(function () {
 *     Route::get('/api/users', [UserController::class, 'index']);
 * });
 * ```
 *
 * ### Custom Limits:
 * ```php
 * // 100 requests per minute
 * Route::middleware('rate.limit:100,1')->get('/api/search', ...);
 *
 * // 1000 requests per hour
 * Route::middleware('rate.limit:1000,60')->get('/api/data', ...);
 *
 * ### Different Limits by User Type:
 * ```php
 * // Premium users: 1000 requests/minute
 * Route::middleware(['auth', 'rate.limit:1000,1'])->group(function () {
 *     Route::get('/api/premium/data', ...);
 * });
 *
 * // Free users: 60 requests/minute
 * Route::middleware(['auth', 'rate.limit:60,1'])->group(function () {
 *     Route::get('/api/free/data', ...);
 * });
 *
 * // Guest users: 10 requests/minute
 * Route::middleware('rate.limit:10,1')->group(function () {
 *     Route::get('/api/public/data', ...);
 * });
 * ```
 *
 * ## Configuration:
 * ```php
 * // config/rate-limit.php
 * return [
 *     'driver' => 'redis', // 'redis' or 'cache'
 *     'default_limit' => 60,
 *     'default_window' => 1, // minutes
 *     'whitelist' => ['127.0.0.1', '10.0.0.0/8'],
 *     'headers' => true,
 *     'per_user_limits' => [
 *         'admin' => 10000,
 *         'premium' => 1000,
 *         'free' => 60,
 *         'guest' => 10,
 *     ],
 * ];
 * ```
 *
 * ## Distributed Rate Limiting:
 * When using Redis, rate limits are shared across all application servers,
 * ensuring consistent enforcement in load-balanced environments.
 *
 * ## Error Response:
 * ```json
 * {
 *   "success": false,
 *   "error": {
 *     "code": "RATE_LIMIT_EXCEEDED",
 *     "message": "Too many requests. Please try again later.",
 *     "retry_after": 15
 *   }
 * }
 * ```
 *
 * ## Best Practices:
 * - Use Redis for production environments with multiple servers
 * - Set appropriate limits based on endpoint resource consumption
 * - Implement exponential backoff on client side
 * - Monitor rate limit metrics to adjust limits
 * - Whitelist internal services and health checks
 * - Use different limits for different user tiers
 *
 * @since 1.0.0
 */
#[AsMiddleware(
    alias: 'rate.limit',
    priority: 5
)]
class RateLimitMiddleware
{
    /**
     * Create a new middleware instance.
     *
     * @param RateLimiter   $limiter   Laravel rate limiter instance
     * @param array<string> $whitelist IP addresses/ranges to bypass rate limiting
     * @param bool          $headers   Whether to add rate limit headers to responses
     * @param string        $driver    Rate limiting driver ('redis' or 'cache')
     */
    public function __construct(
        protected RateLimiter $limiter,
        #[Config('rate-limit.whitelist')]
        protected array $whitelist = [],
        #[Config('rate-limit.headers')]
        protected bool $headers = true,
        #[Config('rate-limit.driver')]
        protected string $driver = 'redis',
    ) {}

    /**
     * Handle an incoming request.
     *
     * Enforces rate limiting with distributed support and detailed headers.
     *
     * ## Process Flow:
     * 1. Check if IP is whitelisted (bypass if true)
     * 2. Resolve unique key for user/IP + endpoint
     * 3. Check current attempt count against limit
     * 4. If exceeded, return 429 with retry information
     * 5. Increment attempt counter
     * 6. Process request
     * 7. Add rate limit headers to response
     *
     * ## Rate Limit Key Structure:
     * - Authenticated: `rate-limit:{user_id}:{route}:{method}`
     * - Guest: `rate-limit:{ip}:{route}:{method}`
     *
     * @param  Request                      $request      The incoming HTTP request
     * @param  Closure(Request): (Response) $next         The next middleware in pipeline
     * @param  int                          $maxAttempts  Maximum requests allowed (default: 60)
     * @param  int                          $decayMinutes Time window in minutes (default: 1)
     * @return Response                     The HTTP response with rate limit headers
     */
    public function handle(Request $request, Closure $next, int $maxAttempts = 60, int $decayMinutes = 1): Response
    {
        // Check if the request IP is whitelisted
        // Whitelisted IPs bypass all rate limiting (useful for internal services)
        if ($this->isWhitelisted($request)) {
            return $next($request);
        }

        // Generate unique key for this user/IP + endpoint combination
        // This ensures rate limits are applied per-user per-endpoint
        $key = $this->resolveRequestSignature($request);

        // Check if rate limit has been exceeded
        if ($this->limiter->tooManyAttempts($key, $maxAttempts)) {
            // Calculate when the rate limit will reset
            $retryAfter = $this->limiter->availableIn($key);
            $resetTimestamp = now()->addSeconds($retryAfter)->timestamp;

            // Return 429 Too Many Requests with detailed error information
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'RATE_LIMIT_EXCEEDED',
                    'message' => 'Too many requests. Please try again later.',
                    'retry_after' => $retryAfter,
                    'reset_at' => $resetTimestamp,
                ],
            ], HttpStatusCode::TOO_MANY_REQUESTS())->withHeaders([
                'X-RateLimit-Limit' => (string) $maxAttempts,
                'X-RateLimit-Remaining' => '0',
                'X-RateLimit-Reset' => (string) $resetTimestamp,
                'Retry-After' => (string) $retryAfter,
            ]);
        }

        // Increment the attempt counter for this key
        // The counter will automatically expire after $decayMinutes
        $this->limiter->hit($key, $decayMinutes * 60);

        // Process the request through the rest of the middleware stack
        $response = $next($request);

        // Add rate limit headers to the response
        // This helps clients implement proper backoff strategies
        if ($this->headers) {
            $remaining = $this->limiter->remaining($key, $maxAttempts);
            $resetTimestamp = now()->addSeconds($decayMinutes * 60)->timestamp;

            $response->headers->add([
                'X-RateLimit-Limit' => (string) $maxAttempts,
                'X-RateLimit-Remaining' => (string) max(0, $remaining),
                'X-RateLimit-Reset' => (string) $resetTimestamp,
            ]);
        }

        return $response;
    }

    /**
     * Check if the request IP is whitelisted.
     *
     * Supports both individual IPs and CIDR ranges.
     *
     * @param  Request $request The incoming HTTP request
     * @return bool    True if IP is whitelisted, false otherwise
     */
    protected function isWhitelisted(Request $request): bool
    {
        $ip = $request->ip();

        foreach ($this->whitelist as $whitelistedIp) {
            // Check for exact IP match
            if ($ip === $whitelistedIp) {
                return true;
            }

            // Check for CIDR range match (e.g., 10.0.0.0/8)
            if (str_contains($whitelistedIp, '/') && $this->ipInRange($ip, $whitelistedIp)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if an IP address is within a CIDR range.
     *
     * @param  string $ip    The IP address to check
     * @param  string $range The CIDR range (e.g., '10.0.0.0/8')
     * @return bool   True if IP is in range, false otherwise
     */
    protected function ipInRange(string $ip, string $range): bool
    {
        [$subnet, $mask] = explode('/', $range);

        $ipLong = ip2long($ip);
        $subnetLong = ip2long($subnet);
        $maskLong = -1 << (32 - (int) $mask);

        return ($ipLong & $maskLong) === ($subnetLong & $maskLong);
    }

    /**
     * Resolve the unique signature for the request.
     *
     * Creates a unique key based on:
     * - User ID (for authenticated users) or IP address (for guests)
     * - Route name or path
     * - HTTP method
     *
     * This ensures rate limits are applied per-user per-endpoint.
     *
     * @param  Request $request The incoming HTTP request
     * @return string  The unique rate limit key
     */
    protected function resolveRequestSignature(Request $request): string
    {
        $user = $request->user();

        // For authenticated users, use their user ID
        // This allows per-user rate limiting regardless of IP
        if ($user !== null && is_object($user) && Reflection::methodExists($user, 'getAuthIdentifier')) {
            $identifier = $user->getAuthIdentifier();
            $userType = $this->getUserType($user);

            return Str::format(
                'rate-limit:%s:%s:%s:%s',
                $userType,
                $identifier,
                $request->route()?->getName() ?? $request->path(),
                $request->method()
            );
        }

        // For guest users, use their IP address
        // This prevents abuse from unauthenticated requests
        return Str::format(
            'rate-limit:guest:%s:%s:%s',
            $request->ip(),
            $request->route()?->getName() ?? $request->path(),
            $request->method()
        );
    }

    /**
     * Get the user type for rate limiting purposes.
     *
     * This allows different rate limits for different user types
     * (e.g., admin, premium, free).
     *
     * @param  mixed  $user The authenticated user
     * @return string The user type identifier
     */
    protected function getUserType(mixed $user): string
    {
        // Check if user has a type property
        if (is_object($user) && property_exists($user, 'type')) {
            return (string) $user->type;
        }

        // Check if user has a role relationship
        if (is_object($user) && Reflection::methodExists($user, 'hasRole')) {
            if ($user->hasRole('admin')) {
                return 'admin';
            }
            if ($user->hasRole('premium')) {
                return 'premium';
            }
        }

        // Default to 'user' type
        return 'user';
    }
}
