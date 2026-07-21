<?php

declare(strict_types=1);

/**
 * Snake Case Middleware
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
use Stackra\Routing\Attributes\AsMiddleware;
use Stackra\Support\Arr;
use Stackra\Support\CaseConverter;
use Symfony\Component\HttpFoundation\Response;

/**
 * SnakeCase Middleware.
 *
 * Converts all incoming request data keys from camelCase to snake_case.
 * This middleware is useful for APIs that receive camelCase data from
 * JavaScript/TypeScript frontends but need snake_case in the backend.
 *
 * ## Features:
 * - Converts request input keys to snake_case
 * - Handles JSON request bodies
 * - Handles form data
 * - Handles query parameters
 * - Handles route parameters
 * - Preserves file uploads
 * - Handles nested arrays and objects
 *
 * ## Usage:
 *
 * ### Global Middleware:
 * ```php
 * // In app/Http/Kernel.php
 * protected $middleware = [
 *     \Stackra\Foundation\Middlewares\SnakeCaseMiddleware::class,
 * ];
 * ```
 *
 * ### Route Middleware:
 * ```php
 * // In app/Http/Kernel.php
 * protected $middlewareAliases = [
 *     'snakecase' => \Stackra\Foundation\Middlewares\SnakeCaseMiddleware::class,
 * ];
 *
 * // In routes
 * Route::middleware('snakecase')->group(function () {
 *     Route::post('/users', [UserController::class, 'store']);
 * });
 * ```
 *
 * ### Example:
 * ```php
 * // Frontend sends:
 * {
 *     "userName": "John",
 *     "emailAddress": "john@example.com",
 *     "createdAt": "2024-01-01"
 * }
 *
 * // Backend receives:
 * {
 *     "user_name": "John",
 *     "email_address": "john@example.com",
 *     "created_at": "2024-01-01"
 * }
 * ```
 *
 * ### Typical API Setup:
 * ```php
 * // Request: camelCase → snake_case (SnakeCaseMiddleware)
 * // Controller: snake_case processing
 * // Response: snake_case → camelCase (CamelCaseMiddleware)
 * ```
 *
 * @category   Middleware
 *
 * @since      1.0.0
 */
#[AsMiddleware(
    alias: 'snakecase',
    groups: ['api'],
    priority: 10
)]
class SnakeCaseMiddleware
{
    /**
     * Query parameters that should not be converted.
     * These are typically used by filtering/sorting libraries like Laravel Purity.
     *
     * @var array<string>
     */
    protected array $excludedQueryParams = [
        'filters',
        'sort',
        'includes',
        'page',
        'per_page',
        'perPage',
    ];

    /**
     * Constructor.
     *
     * @param CaseConverter $converter Case converter instance
     */
    public function __construct(
        protected CaseConverter $converter
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
        // Convert request input to snake_case
        $this->convertRequestInput($request);

        // Convert query parameters to snake_case
        $this->convertQueryParameters($request);

        // Convert route parameters to snake_case
        $this->convertRouteParameters($request);

        return $next($request);
    }

    /**
     * Convert request input (JSON body, form data) to snake_case.
     *
     * @param Request $request The request instance
     */
    protected function convertRequestInput(Request $request): void
    {
        // Get all input data
        $input = $request->all();

        // Skip if no input
        if (empty($input)) {
            return;
        }

        // Convert keys to snake_case
        $convertedInput = $this->converter->convert(CaseConverter::CASE_SNAKE, $input);

        // Ensure converted input is an array with string keys
        if (! is_array($convertedInput)) {
            return;
        }

        /* @var array<string, mixed> $convertedInput */

        // Replace the request input
        $request->replace($convertedInput);

        // If it's a JSON request, also update the JSON data
        if ($request->isJson()) {
            $request->json()->replace($convertedInput);
        }
    }

    /**
     * Convert query parameters to snake_case.
     *
     * @param Request $request The request instance
     */
    protected function convertQueryParameters(Request $request): void
    {
        // Get query parameters
        $query = $request->query->all();

        // Skip if no query parameters
        if ($query === []) {
            return;
        }

        // Separate excluded parameters from convertible ones
        $excluded = [];
        $convertible = [];

        foreach ($query as $key => $value) {
            if (in_array($key, $this->excludedQueryParams, true)) {
                $excluded[$key] = $value;
            } else {
                $convertible[$key] = $value;
            }
        }

        // Convert only the convertible keys to snake_case
        $converted = [];
        if ($convertible !== []) {
            $convertedInput = $this->converter->convert(CaseConverter::CASE_SNAKE, $convertible);

            // Ensure converted query is an array with string keys
            if (is_array($convertedInput)) {
                $converted = $convertedInput;
            }
        }

        // Merge excluded and converted parameters
        $finalQuery = Arr::merge($converted, $excluded);

        // Replace query parameters
        $request->query->replace($finalQuery);
    }

    /**
     * Convert route parameters to snake_case.
     *
     * @param Request $request The request instance
     */
    protected function convertRouteParameters(Request $request): void
    {
        // Get route parameters
        $route = $request->route();

        if (! $route) {
            return;
        }

        $parameters = $route->parameters();

        // Skip if no route parameters
        if (empty($parameters)) {
            return;
        }

        // Convert keys to snake_case
        $convertedInput = $this->converter->convert(CaseConverter::CASE_SNAKE, $parameters);

        // Ensure it's iterable (convert returns mixed but should be array for array input)
        if (! is_iterable($convertedInput)) {
            return;
        }

        // Update each parameter individually
        foreach ($convertedInput as $key => $value) {
            if (is_string($key) && (is_string($value) || is_object($value) || $value === null)) {
                $route->setParameter($key, $value);
            }
        }
    }
}
