<?php

declare(strict_types=1);

/**
 * Camel Case Middleware
 *
 * Response middleware that transforms outgoing HTTP responses.
 * Modifies response data after controller processing for consistent API output.
 *
 * @category Middlewares
 *
 * @since    1.0.0
 */
namespace Academorix\Foundation\Middlewares\Response;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Academorix\Routing\Attributes\AsMiddleware;
use Academorix\Support\CaseConverter;
use Symfony\Component\HttpFoundation\Response;

/**
 * CamelCase Middleware.
 *
 * Converts all JSON response keys from snake_case to camelCase.
 * This middleware is useful for APIs that need to return camelCase
 * responses for JavaScript/TypeScript frontends while maintaining
 * snake_case in the backend.
 *
 * ## Features:
 * - Converts response keys to camelCase
 * - Preserves metadata keys
 * - Handles nested arrays and objects
 * - Only processes JSON responses
 * - Maintains response status and headers
 *
 * ## Usage:
 *
 * ### Global Middleware:
 * ```php
 * // In app/Http/Kernel.php
 * protected $middleware = [
 *     \Academorix\Foundation\Middlewares\CamelCaseMiddleware::class,
 * ];
 * ```
 *
 * ### Route Middleware:
 * ```php
 * // In app/Http/Kernel.php
 * protected $middlewareAliases = [
 *     'camelcase' => \Academorix\Foundation\Middlewares\CamelCaseMiddleware::class,
 * ];
 *
 * // In routes
 * Route::middleware('camelcase')->group(function () {
 *     Route::get('/users', [UserController::class, 'index']);
 * });
 * ```
 *
 * ### Example:
 * ```php
 * // Backend returns:
 * {
 *     "user_name": "John",
 *     "email_address": "john@example.com",
 *     "created_at": "2024-01-01"
 * }
 *
 * // Frontend receives:
 * {
 *     "userName": "John",
 *     "emailAddress": "john@example.com",
 *     "createdAt": "2024-01-01"
 * }
 * ```
 *
 * @category   Middleware
 *
 * @since      1.0.0
 */
#[AsMiddleware(alias: 'camelcase', groups: ['api'], priority: 85)]
class CamelCaseMiddleware
{
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
        /** @var Response $response */
        $response = $next($request);

        // Only process JSON responses
        if (! $response instanceof JsonResponse) {
            return $response;
        }

        // Get the original data
        $data = $response->getData(true);

        // Convert keys to camelCase
        $convertedData = $this->converter->convert(CaseConverter::CASE_CAMEL, $data);

        // Set the converted data back to the response
        $response->setData($convertedData);

        return $response;
    }
}
