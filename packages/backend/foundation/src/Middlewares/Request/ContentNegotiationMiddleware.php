<?php

declare(strict_types=1);

/**
 * Content Negotiation Middleware
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

use function in_array;

use Academorix\Foundation\Exceptions\BadRequestException;
use Academorix\Routing\Attributes\AsMiddleware;
use Academorix\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

/**
 * Content Negotiation Middleware.
 *
 * Handles HTTP content negotiation by validating Accept and Content-Type headers.
 * This ensures that clients and servers can communicate using mutually supported
 * content types, preventing format mismatches and improving API reliability.
 *
 * ## What is Content Negotiation?
 * Content negotiation is the mechanism for serving different representations
 * of a resource based on client preferences. This middleware ensures that:
 * - Clients request supported content types (Accept header)
 * - Clients send supported content types (Content-Type header)
 * - Responses are formatted according to client preferences
 *
 * ## Features:
 * - Accept header validation
 * - Content-Type header validation
 * - Multiple content type support
 * - Quality factor (q-value) parsing
 * - Wildcard support (**, application/*)
 * - Configurable supported types
 * - Clear error messages for unsupported types
 *
 * ## Supported Content Types:
 * - application/json (default)
 * - application/xml
 * - application/x-www-form-urlencoded
 * - multipart/form-data
 * - text/plain
 * - text/html
 *
 * ## Usage:
 *
 * ### Global Middleware:
 * ```php
 * // In app/Http/Kernel.php
 * protected $middleware = [
 *     \Academorix\Foundation\Middlewares\Request\ContentNegotiationMiddleware::class,
 * ];
 * ```
 *
 * ### API Routes:
 * ```php
 * Route::middleware('content.negotiation')->group(function () {
 *     Route::post('/api/users', [UserController::class, 'store']);
 * });
 * ```
 *
 * ### Custom Supported Types:
 * ```php
 * Route::middleware('content.negotiation:json,xml')->group(function () {
 *     Route::get('/api/data', [DataController::class, 'index']);
 * });
 * ```
 *
 * ## Request Examples:
 *
 * ### Valid JSON Request:
 * ```
 * POST /api/users
 * Content-Type: application/json
 * Accept: application/json
 *
 * {"name": "John Doe", "email": "john@example.com"}
 * ```
 *
 * ### Valid XML Request:
 * ```
 * POST /api/users
 * Content-Type: application/xml
 * Accept: application/xml
 *
 * <user><name>John Doe</name><email>john@example.com</email></user>
 * ```
 *
 * ### Multiple Accept Types:
 * ```
 * GET /api/users
 * Accept: application/json, application/xml;q=0.9, **;q=0.8
 * ```
 *
 * ### Invalid Request (Unsupported Type):
 * ```
 * POST /api/users
 * Content-Type: application/yaml
 * Accept: application/json
 *
 * Response: 400 Bad Request
 * {
 *   "success": false,
 *   "error": {
 *     "code": "UNSUPPORTED_CONTENT_TYPE",
 *     "message": "Content-Type 'application/yaml' is not supported",
 *     "supported_types": ["application/json", "application/xml"]
 *   }
 * }
 * ```
 *
 * ## Quality Factors (q-values):
 * Clients can specify preferences using quality factors:
 * ```
 * Accept: application/json;q=1.0, application/xml;q=0.8, text/plain;q=0.5
 * ```
 * - q=1.0: Most preferred (default if not specified)
 * - q=0.8: Second preference
 * - q=0.5: Least preferred
 *
 * ## Wildcard Support:
 * - `**`: Accept any content type
 * - `application/*`: Accept any application type
 * - `text/*`: Accept any text type
 *
 * ## Error Responses:
 *
 * ### Unsupported Content-Type:
 * ```json
 * {
 *   "success": false,
 *   "error": {
 *     "code": "UNSUPPORTED_CONTENT_TYPE",
 *     "message": "Content-Type 'application/yaml' is not supported",
 *     "supported_types": ["application/json", "application/xml"]
 *   }
 * }
 * ```
 *
 * ### Unsupported Accept Type:
 * ```json
 * {
 *   "success": false,
 *   "error": {
 *     "code": "NOT_ACCEPTABLE",
 *     "message": "None of the requested content types are supported",
 *     "requested_types": ["application/yaml"],
 *     "supported_types": ["application/json", "application/xml"]
 *   }
 * }
 * ```
 *
 * ## Best Practices:
 * - Always include Accept header in requests
 * - Include Content-Type for requests with body
 * - Use quality factors to specify preferences
 * - Handle 406 Not Acceptable responses gracefully
 * - Support at least JSON for APIs
 * - Document supported content types in API docs
 *
 * ## Skip Validation:
 * Some routes may not need content negotiation:
 * - GET requests (no request body)
 * - File uploads (multipart/form-data)
 * - Health check endpoints
 * - Static file serving
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation
 * @see https://tools.ietf.org/html/rfc7231#section-5.3
 * @since 1.0.0
 */
#[AsMiddleware(
    alias: 'content.negotiation',
    priority: 20
)]
class ContentNegotiationMiddleware
{
    /**
     * Default supported content types.
     *
     * @var array<string>
     */
    protected const DEFAULT_SUPPORTED_TYPES = [
        'application/json',
        'application/xml',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
        'text/plain',
    ];

    /**
     * HTTP methods that require Content-Type validation.
     *
     * @var array<string>
     */
    protected const METHODS_WITH_BODY = ['POST', 'PUT', 'PATCH'];

    /**
     * Handle an incoming request.
     *
     * Validates Accept and Content-Type headers to ensure content negotiation.
     *
     * ## Process Flow:
     * 1. Get supported content types (from parameters or defaults)
     * 2. Validate Content-Type header (for requests with body)
     * 3. Validate Accept header
     * 4. Store negotiated content type in request attributes
     * 5. Continue to next middleware
     *
     * @param  Request                      $request           The incoming HTTP request
     * @param  Closure(Request): (Response) $next              The next middleware in pipeline
     * @param  string                       ...$supportedTypes Supported content types (optional)
     * @return Response                     The HTTP response
     *
     * @throws BadRequestException If Content-Type is not supported
     */
    public function handle(Request $request, Closure $next, string ...$supportedTypes): Response
    {
        // Use provided supported types or defaults
        $supportedTypes = $supportedTypes === []
            ? self::DEFAULT_SUPPORTED_TYPES
            : $this->expandShortTypes($supportedTypes);

        // Validate Content-Type for requests with body
        if ($this->shouldValidateContentType($request)) {
            $this->validateContentType($request, $supportedTypes);
        }

        // Validate Accept header
        $acceptedType = $this->validateAcceptHeader($request, $supportedTypes);

        // Store negotiated content type in request attributes
        // This can be used by controllers to format responses
        $request->attributes->set('accepted_content_type', $acceptedType);

        return $next($request);
    }

    /**
     * Check if Content-Type validation is needed.
     *
     * Content-Type validation is only needed for requests with a body.
     *
     * @param  Request $request The incoming HTTP request
     * @return bool    True if validation is needed
     */
    protected function shouldValidateContentType(Request $request): bool
    {
        return in_array($request->method(), self::METHODS_WITH_BODY, true) &&
            (int) $request->header('Content-Length', '0') > 0;
    }

    /**
     * Validate Content-Type header.
     *
     * Ensures the request Content-Type is supported.
     *
     * @param Request       $request        The incoming HTTP request
     * @param array<string> $supportedTypes Supported content types
     *
     * @throws BadRequestException If Content-Type is not supported
     */
    protected function validateContentType(Request $request, array $supportedTypes): void
    {
        $contentType = $request->header('Content-Type');

        throw_if($contentType === null, BadRequestException::class, 'Content-Type header is required for requests with body');

        // Extract media type (remove charset and other parameters)
        $mediaType = $this->extractMediaType($contentType);

        // Check if content type is supported
        if (! $this->isTypeSupported($mediaType, $supportedTypes)) {
            throw new BadRequestException(
                "Content-Type '{$mediaType}' is not supported. Supported types: " . implode(', ', $supportedTypes)
            );
        }
    }

    /**
     * Validate Accept header.
     *
     * Ensures at least one requested content type is supported.
     *
     * @param  Request       $request        The incoming HTTP request
     * @param  array<string> $supportedTypes Supported content types
     * @return string        The negotiated content type
     *
     * @throws BadRequestException If no acceptable content type is found
     */
    protected function validateAcceptHeader(Request $request, array $supportedTypes): string
    {
        $acceptHeader = $request->header('Accept', '*/*');

        // Parse Accept header and get list of acceptable types
        $acceptableTypes = $this->parseAcceptHeader($acceptHeader);

        // Find first supported type
        foreach ($acceptableTypes as $acceptableType) {
            if ($this->isTypeSupported($acceptableType, $supportedTypes)) {
                return $acceptableType;
            }
        }

        // If wildcard is accepted, return first supported type
        if (in_array('*/*', $acceptableTypes, true)) {
            return $supportedTypes[0];
        }

        // No acceptable type found
        throw new BadRequestException(
            'None of the requested content types are supported. Supported types: ' . implode(', ', $supportedTypes)
        );
    }

    /**
     * Parse Accept header.
     *
     * Parses the Accept header and returns list of acceptable types
     * sorted by quality factor (q-value).
     *
     * @param  string        $acceptHeader The Accept header value
     * @return array<string> List of acceptable types sorted by preference
     */
    protected function parseAcceptHeader(string $acceptHeader): array
    {
        $types = [];

        // Split by comma to get individual types
        $parts = explode(',', $acceptHeader);

        foreach ($parts as $part) {
            $part = trim($part);

            // Extract media type and quality factor
            if (str_contains($part, ';')) {
                [$mediaType, $params] = explode(';', $part, 2);
                $mediaType = trim($mediaType);

                // Extract q-value
                $quality = 1.0;
                if (preg_match('/q=([\d.]+)/', $params, $matches)) {
                    $quality = (float) $matches[1];
                }
            } else {
                $mediaType = $part;
                $quality = 1.0;
            }

            $types[] = [
                'type' => $mediaType,
                'quality' => $quality,
            ];
        }

        // Sort by quality factor (descending)
        usort($types, fn (array $a, array $b): int => $b['quality'] <=> $a['quality']);

        // Return just the types
        return Arr::column($types, 'type');
    }

    /**
     * Check if a type is supported.
     *
     * Supports exact matches and wildcards.
     *
     * @param  string        $type           The type to check
     * @param  array<string> $supportedTypes Supported content types
     * @return bool          True if type is supported
     */
    protected function isTypeSupported(string $type, array $supportedTypes): bool
    {
        // Exact match
        if (in_array($type, $supportedTypes, true)) {
            return true;
        }

        // Wildcard match (*/* or application/*)
        if ($type === '*/*') {
            return true;
        }

        // Check for partial wildcard (e.g., application/*)
        if (str_ends_with($type, '/*')) {
            $prefix = substr($type, 0, -2);
            foreach ($supportedTypes as $supportedType) {
                if (str_starts_with($supportedType, $prefix . '/')) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Extract media type from Content-Type header.
     *
     * Removes charset and other parameters.
     *
     * @param  string $contentType The Content-Type header value
     * @return string The media type
     */
    protected function extractMediaType(string $contentType): string
    {
        // Split by semicolon to remove parameters
        $parts = explode(';', $contentType);

        return trim($parts[0]);
    }

    /**
     * Expand short type names to full media types.
     *
     * Allows using short names like 'json' instead of 'application/json'.
     *
     * @param  array<string> $types Short type names
     * @return array<string> Full media types
     */
    protected function expandShortTypes(array $types): array
    {
        $expanded = [];

        $shortTypes = [
            'json' => 'application/json',
            'xml' => 'application/xml',
            'html' => 'text/html',
            'text' => 'text/plain',
            'form' => 'application/x-www-form-urlencoded',
            'multipart' => 'multipart/form-data',
        ];

        foreach ($types as $type) {
            $expanded[] = $shortTypes[$type] ?? $type;
        }

        return $expanded;
    }
}
