<?php


/**
 * Validate Api Version Middleware
 *
 * Request middleware that transforms or validates incoming HTTP requests.
 * Processes the request before it reaches the controller layer.
 *
 * @category Middleware
 *
 * @since    1.0.0
 */

declare(strict_types=1);

namespace Stackra\Foundation\Middleware;

use Closure;
use Illuminate\Container\Attributes\Config;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

use function in_array;

use Stackra\Routing\Attributes\AsMiddleware;
use Symfony\Component\HttpFoundation\Response;

/**
 * Validate API Version Middleware.
 *
 * Validates that the requested API version is supported by the application.
 * This enables API versioning and helps maintain backward compatibility
 * while introducing new features.
 *
 * ## Version Sources:
 * 1. **API-Version Header** (recommended)
 *    ```
 *    GET /api/users
 *    API-Version: v1
 *    ```
 *
 * 2. **URL Path** (handled by routing)
 *    ```
 *    GET /api/v1/users
 *    ```
 *
 * 3. **Default Version** (fallback)
 *    - From config/api.php
 *    - Used if no version specified
 *
 * ## Configuration:
 *
 * ```php
 * // config/api.php
 * return [
 *     'version' => 'v1',  // Default version
 *     'supported_versions' => ['v1', 'v2'],  // Supported versions
 * ];
 * ```
 *
 * ## Error Response:
 *
 * ```json
 * {
 *   "success": false,
 *   "message": "Unsupported API version",
 *   "supported_versions": ["v1", "v2"]
 * }
 * ```
 *
 * ## Version Strategy:
 *
 * ### URL-Based Versioning:
 * ```
 * /api/v1/users  -> Version 1
 * /api/v2/users  -> Version 2
 * ```
 * **Pros**: Clear, cacheable, easy to test
 * **Cons**: Requires route duplication
 *
 * ### Header-Based Versioning:
 * ```
 * GET /api/users
 * API-Version: v1
 * ```
 * **Pros**: Clean URLs, flexible
 * **Cons**: Harder to cache, less visible
 *
 * ## Best Practices:
 * - Use semantic versioning (v1, v2, v3)
 * - Maintain at least 2 versions simultaneously
 * - Deprecate old versions gradually
 * - Document version differences
 * - Provide migration guides
 *
 * ## Usage in Controllers:
 *
 * ```php
 * public function index(Request $request)
 * {
 *     $version = $request->attributes->get('api_version');
 *
 *     if ($version === 'v2') {
 *         // Return v2 response format
 *     }
 *
 *     // Return v1 response format
 * }
 * ```
 *
 * @since 1.0.0
 */
#[AsMiddleware(
    alias: 'validate.version',
    priority: 70
)]
class ValidateApiVersion
{
    /**
     * Create a new middleware instance.
     *
     * @param array<string> $supportedVersions Supported API versions
     * @param string        $defaultVersion    Default API version
     */
    public function __construct(
        #[Config('api.supported_versions')]
        protected array $supportedVersions = ['v1'],
        #[Config('api.version')]
        protected string $defaultVersion = 'v1',
        #[Config('api.deprecated_versions', [])]
        protected array $deprecatedVersions = [],
    ) {}

    /**
     * Handle an incoming request.
     *
     * Validates the API version and stores it in request attributes
     * for use by controllers and other middleware.
     *
     * ## Process:
     * 1. Get supported versions from config
     * 2. Get requested version from header or use default
     * 3. Validate version is supported
     * 4. Store version in request attributes
     * 5. Add version headers to response
     * 6. Continue or return error
     *
     * @param  Request                      $request The incoming HTTP request
     * @param  Closure(Request): (Response) $next    The next middleware in the pipeline
     * @return Response                     The HTTP response (or error if version unsupported)
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get requested version from API-Version header
        // Falls back to default version from config if header not present or empty
        $requestedVersion = $request->header('API-Version', $this->defaultVersion);

        // Treat empty string as missing header - use default version
        if (empty($requestedVersion)) {
            $requestedVersion = $this->defaultVersion;
        }

        // Validate that the requested version is supported
        if (! in_array($requestedVersion, $this->supportedVersions, true)) {
            // Return error response with list of supported versions
            // This helps clients understand what versions are available
            return response()->json([
                'success' => false,
                'message' => 'Unsupported API version',
                'supported_versions' => $this->supportedVersions,
            ], 400);
        }

        // Store the validated version in request attributes
        // This makes it available to controllers via $request->attributes->get('api_version')
        $request->attributes->set('api_version', $requestedVersion);

        // Add API version to log context for debugging
        Log::withContext([
            'api_version' => $requestedVersion,
        ]);

        // Process the request
        $response = $next($request);

        // Add API version headers to response
        // These headers inform clients about version status and lifecycle
        $response->headers->set('X-API-Version', $requestedVersion);

        // Check if this version is deprecated
        $deprecatedVersions = $this->deprecatedVersions;
        $isDeprecated = in_array($requestedVersion, $deprecatedVersions, true);

        // Add deprecation warning header if version is deprecated
        if ($isDeprecated) {
            $response->headers->set('X-API-Deprecated', 'true');

            // Add sunset date if configured (when version will be removed) — dynamic key, stays as config()
            $sunsetDate = config("api.sunset_dates.{$requestedVersion}");
            if ($sunsetDate) {
                $response->headers->set('X-API-Sunset', $sunsetDate);
                $response->headers->set('Sunset', $sunsetDate); // RFC 8594 standard header
            }

            // Add deprecation warning message — dynamic key, stays as config()
            $deprecationMessage = config("api.deprecation_messages.{$requestedVersion}", "API version {$requestedVersion} is deprecated. Please migrate to a newer version.");
            $response->headers->set('X-API-Deprecation-Message', $deprecationMessage);
        } else {
            $response->headers->set('X-API-Deprecated', 'false');
        }

        return $response;
    }
}
