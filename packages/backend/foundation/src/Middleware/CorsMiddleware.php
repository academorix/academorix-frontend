<?php

declare(strict_types=1);

/**
 * Cors Middleware
 *
 * Security middleware that enforces protective measures on incoming requests.
 * Runs in the HTTP pipeline to guard against common attack vectors.
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

use Stackra\Routing\Attributes\AsMiddleware;
use Symfony\Component\HttpFoundation\Response;

/**
 * CORS (Cross-Origin Resource Sharing) Middleware.
 *
 * Handles Cross-Origin Resource Sharing (CORS) by adding appropriate headers
 * to responses, allowing controlled access to resources from different origins.
 * This is essential for modern web applications that make API calls from
 * different domains.
 *
 * ## What is CORS?
 * CORS is a security feature implemented by browsers to prevent malicious
 * websites from making unauthorized requests to your API. This middleware
 * configures which origins, methods, and headers are allowed.
 *
 * ## Features:
 * - Configurable allowed origins (domains)
 * - Configurable allowed HTTP methods
 * - Configurable allowed headers
 * - Preflight request handling (OPTIONS)
 * - Credentials support
 * - Exposed headers configuration
 * - Max age caching for preflight requests
 *
 * ## Configuration:
 * ```php
 * // config/foundation.php
 * 'middleware' => [
 *     'cors' => [
 *         'enabled' => true,
 *         'allowed_origins' => ['https://example.com', 'https://app.example.com'],
 *         'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
 *         'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
 *         'exposed_headers' => ['X-Request-ID', 'X-RateLimit-Limit'],
 *         'max_age' => 3600,
 *         'supports_credentials' => false,
 *     ],
 * ],
 * ```
 *
 * ## Environment Variables:
 * ```env
 * CORS_ENABLED=true
 * CORS_ALLOWED_ORIGINS=https://example.com,https://app.example.com
 * CORS_ALLOWED_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS
 * CORS_ALLOWED_HEADERS=*
 * CORS_EXPOSED_HEADERS=X-Request-ID,X-RateLimit-Limit
 * CORS_MAX_AGE=3600
 * CORS_SUPPORTS_CREDENTIALS=false
 * ```
 *
 * ## Usage:
 *
 * ### Global Middleware (All Routes):
 * ```php
 * // In app/Http/Kernel.php
 * protected $middleware = [
 *     \Stackra\Foundation\Middleware\CorsMiddleware::class,
 * ];
 * ```
 *
 * ### API Routes Only:
 * ```php
 * // In app/Http/Kernel.php
 * protected $middlewareGroups = [
 *     'api' => [
 *         \Stackra\Foundation\Middleware\CorsMiddleware::class,
 *     ],
 * ];
 * ```
 *
 * ### Specific Routes:
 * ```php
 * Route::middleware('cors')->group(function () {
 *     Route::get('/api/public/data', ...);
 * });
 * ```
 *
 * ## Common Scenarios:
 *
 * ### Allow All Origins (Development Only):
 * ```env
 * CORS_ALLOWED_ORIGINS=*
 * ```
 *
 * ### Allow Specific Domains:
 * ```env
 * CORS_ALLOWED_ORIGINS=https://example.com,https://app.example.com
 * ```
 *
 * ### Allow Credentials (Cookies, Auth Headers):
 * ```env
 * CORS_SUPPORTS_CREDENTIALS=true
 * CORS_ALLOWED_ORIGINS=https://example.com  # Must be specific, not *
 * ```
 *
 * ### Custom Headers:
 * ```env
 * CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-Custom-Header
 * ```
 *
 * ## Preflight Requests:
 * Browsers send OPTIONS requests before actual requests to check permissions.
 * This middleware automatically handles preflight requests and returns
 * appropriate headers.
 *
 * ## Response Headers:
 * - **Access-Control-Allow-Origin**: Allowed origin(s)
 * - **Access-Control-Allow-Methods**: Allowed HTTP methods
 * - **Access-Control-Allow-Headers**: Allowed request headers
 * - **Access-Control-Expose-Headers**: Headers exposed to client
 * - **Access-Control-Max-Age**: Preflight cache duration
 * - **Access-Control-Allow-Credentials**: Whether credentials are allowed
 *
 * ## Security Considerations:
 * - Never use `*` for allowed origins in production with credentials
 * - Be specific about allowed origins when possible
 * - Limit allowed methods to what's actually needed
 * - Don't expose sensitive headers unnecessarily
 * - Use HTTPS for all origins in production
 * - Validate origin against whitelist
 *
 * ## Troubleshooting:
 *
 * ### CORS Error in Browser:
 * - Check browser console for specific error
 * - Verify origin is in allowed_origins
 * - Ensure preflight requests return 200
 * - Check that all required headers are allowed
 *
 * ### Credentials Not Working:
 * - Set supports_credentials to true
 * - Use specific origin (not *)
 * - Include credentials in client request
 *
 * ### Custom Headers Blocked:
 * - Add headers to allowed_headers
 * - Check header name spelling
 * - Ensure preflight request succeeds
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
 * @see https://www.w3.org/TR/cors/
 * @since 1.0.0
 */
#[AsMiddleware(
    alias: 'cors',
    priority: 10
)]
class CorsMiddleware
{
    /**
     * Create a new CORS middleware instance.
     *
     * @param array<string> $allowedOrigins      Allowed origins (domains)
     * @param array<string> $allowedMethods      Allowed HTTP methods
     * @param array<string> $allowedHeaders      Allowed request headers
     * @param array<string> $exposedHeaders      Headers exposed to client
     * @param int           $maxAge              Preflight cache duration in seconds
     * @param bool          $supportsCredentials Whether to allow credentials
     */
    public function __construct(
        #[Config('foundation.middleware.cors.allowed_origins')]
        protected array $allowedOrigins = ['*'],
        #[Config('foundation.middleware.cors.allowed_methods')]
        protected array $allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        #[Config('foundation.middleware.cors.allowed_headers')]
        protected array $allowedHeaders = ['*'],
        #[Config('foundation.middleware.cors.exposed_headers')]
        protected array $exposedHeaders = [],
        #[Config('foundation.middleware.cors.max_age')]
        protected int $maxAge = 3600,
        #[Config('foundation.middleware.cors.supports_credentials')]
        protected bool $supportsCredentials = false,
    ) {}

    /**
     * Handle an incoming request.
     *
     * Adds CORS headers to the response and handles preflight requests.
     *
     * ## Process Flow:
     * 1. Get request origin
     * 2. Check if origin is allowed
     * 3. Handle preflight (OPTIONS) requests
     * 4. Add CORS headers to response
     * 5. Return response
     *
     * @param  Request                      $request The incoming HTTP request
     * @param  Closure(Request): (Response) $next    The next middleware in pipeline
     * @return Response                     The HTTP response with CORS headers
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get the origin from the request
        $origin = $request->header('Origin');

        // Handle preflight OPTIONS requests
        // Browsers send OPTIONS before actual request to check permissions
        if ($request->isMethod('OPTIONS')) {
            return $this->handlePreflightRequest($request, $origin);
        }

        // Process the request through the rest of the middleware stack
        $response = $next($request);

        // Add CORS headers to the response
        return $this->addCorsHeaders($response, $origin);
    }

    /**
     * Handle preflight OPTIONS request.
     *
     * Preflight requests are sent by browsers before the actual request
     * to check if the CORS protocol is understood and the server allows
     * the request.
     *
     * @param  Request     $request The OPTIONS request
     * @param  string|null $origin  The request origin
     * @return Response    Empty response with CORS headers
     */
    protected function handlePreflightRequest(Request $request, ?string $origin): Response
    {
        // Create empty 200 response for preflight
        $response = response('', 200);

        // Add CORS headers
        $response = $this->addCorsHeaders($response, $origin);

        // Add preflight-specific headers
        if ($this->allowedMethods !== []) {
            $response->headers->set(
                'Access-Control-Allow-Methods',
                implode(', ', $this->allowedMethods)
            );
        }

        if ($this->allowedHeaders !== []) {
            // If client specifies requested headers, use those
            // Otherwise use configured allowed headers
            $requestedHeaders = $request->header('Access-Control-Request-Headers');

            if ($requestedHeaders && in_array('*', $this->allowedHeaders, true)) {
                $response->headers->set('Access-Control-Allow-Headers', $requestedHeaders);
            } else {
                $response->headers->set(
                    'Access-Control-Allow-Headers',
                    implode(', ', $this->allowedHeaders)
                );
            }
        }

        // Set max age for preflight caching
        // Browsers will cache preflight response for this duration
        $response->headers->set('Access-Control-Max-Age', (string) $this->maxAge);

        return $response;
    }

    /**
     * Add CORS headers to response.
     *
     * Adds the necessary CORS headers based on configuration and
     * the request origin.
     *
     * @param  Response    $response The HTTP response
     * @param  string|null $origin   The request origin
     * @return Response    The response with CORS headers
     */
    protected function addCorsHeaders(Response $response, ?string $origin): Response
    {
        // Determine allowed origin
        $allowedOrigin = $this->getAllowedOrigin($origin);

        // Add Access-Control-Allow-Origin header
        if ($allowedOrigin !== null) {
            $response->headers->set('Access-Control-Allow-Origin', $allowedOrigin);
        }

        // Add Access-Control-Allow-Credentials header
        // This allows cookies and authentication headers to be sent
        if ($this->supportsCredentials) {
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
        }

        // Add Access-Control-Expose-Headers header
        // This tells the browser which headers can be accessed by client code
        if ($this->exposedHeaders !== []) {
            $response->headers->set(
                'Access-Control-Expose-Headers',
                implode(', ', $this->exposedHeaders)
            );
        }

        // Add Vary header to indicate response varies by Origin
        // This is important for caching
        $response->headers->set('Vary', 'Origin', false);

        return $response;
    }

    /**
     * Get the allowed origin for the request.
     *
     * Checks if the request origin is in the allowed origins list.
     * Returns the origin if allowed, null otherwise.
     *
     * @param  string|null $origin The request origin
     * @return string|null The allowed origin or null
     */
    protected function getAllowedOrigin(?string $origin): ?string
    {
        // If no origin in request, no CORS headers needed
        if ($origin === null) {
            return null;
        }

        // If wildcard is allowed, return it
        // Note: Cannot use * with credentials
        if (in_array('*', $this->allowedOrigins, true)) {
            if ($this->supportsCredentials) {
                // When credentials are supported, must return specific origin
                return $origin;
            }

            return '*';
        }

        // Check if origin is in allowed list
        if (in_array($origin, $this->allowedOrigins, true)) {
            return $origin;
        }

        // Check for pattern matching (e.g., *.example.com)
        foreach ($this->allowedOrigins as $allowedOrigin) {
            if ($this->matchesOriginPattern($origin, $allowedOrigin)) {
                return $origin;
            }
        }

        // Origin not allowed
        return null;
    }

    /**
     * Check if origin matches a pattern.
     *
     * Supports wildcard patterns like *.example.com
     *
     * @param  string $origin  The request origin
     * @param  string $pattern The allowed origin pattern
     * @return bool   True if origin matches pattern
     */
    protected function matchesOriginPattern(string $origin, string $pattern): bool
    {
        // Convert pattern to regex
        // Replace * with .* for regex matching
        $regex = '/^' . str_replace(['*', '.'], ['.*', '\.'], $pattern) . '$/';

        return (bool) preg_match($regex, $origin);
    }
}
