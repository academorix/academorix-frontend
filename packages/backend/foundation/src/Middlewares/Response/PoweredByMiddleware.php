<?php

declare(strict_types=1);

/**
 * Powered By Middleware
 *
 * Response middleware that transforms outgoing HTTP responses.
 * Modifies response data after controller processing for consistent API output.
 *
 * @category Middlewares
 *
 * @since    1.0.0
 */
namespace Stackra\Foundation\Middlewares\Response;

use Closure;
use Illuminate\Container\Attributes\Config;
use Illuminate\Http\Request;
use Stackra\Routing\Attributes\AsMiddleware;
use Symfony\Component\HttpFoundation\Response;

/**
 * Powered By Middleware.
 *
 * Adds a custom "X-Powered-By" header to all responses.
 * This middleware can be used for branding or to identify
 * the technology stack powering the application.
 *
 * ## Features:
 * - Adds custom X-Powered-By header
 * - Configurable header value
 * - Can remove default PHP X-Powered-By header
 * - Lightweight and performant
 *
 * ## Configuration:
 *
 * Set in `.env`:
 * ```env
 * APP_POWERED_BY="Stackra Framework"
 * APP_REMOVE_PHP_POWERED_BY=true
 * ```
 *
 * ## Usage:
 *
 * ### Global Middleware:
 * ```php
 * // In app/Http/Kernel.php
 * protected $middleware = [
 *     \Stackra\Foundation\Middlewares\PoweredByMiddleware::class,
 * ];
 * ```
 *
 * ### Route Middleware:
 * ```php
 * // In app/Http/Kernel.php
 * protected $middlewareAliases = [
 *     'powered' => \Stackra\Foundation\Middlewares\PoweredByMiddleware::class,
 * ];
 *
 * // In routes
 * Route::middleware('powered')->group(function () {
 *     Route::get('/api/users', [UserController::class, 'index']);
 * });
 * ```
 *
 * ### Example Response Headers:
 * ```
 * X-Powered-By: Stackra Framework
 * ```
 *
 * ## Security Note:
 * Be cautious about revealing technology stack information in production.
 * Consider disabling this middleware or using a generic value in production.
 *
 * @category   Middleware
 *
 * @since      1.0.0
 */
#[AsMiddleware(
    alias: 'powered',
    priority: 95
)]
class PoweredByMiddleware
{
    /**
     * Create a new PoweredByMiddleware instance.
     *
     * @param string $poweredBy          The value for the X-Powered-By header
     * @param bool   $removePhpPoweredBy Whether to remove PHP's default X-Powered-By header
     */
    public function __construct(
        #[Config('app.powered_by', 'Stackra Framework')]
        private readonly string $poweredBy,
        #[Config('app.remove_php_powered_by', false)]
        private readonly bool $removePhpPoweredBy,
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

        // Add the X-Powered-By header
        $response->headers->set('X-Powered-By', $this->poweredBy);

        // Optionally remove PHP's default X-Powered-By header
        if ($this->removePhpPoweredBy) {
            $response->headers->remove('X-Powered-By');
            $response->headers->set('X-Powered-By', $this->poweredBy);
        }

        return $response;
    }
}
