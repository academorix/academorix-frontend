<?php


/**
 * Middleware Attribute
 *
 * PHP 8 attribute for compile-time metadata annotation in the Framework module.
 * Discovered by the compiler to configure runtime behavior automatically.
 *
 * @category Attributes
 *
 * @since    1.0.0
 */

declare(strict_types=1);

namespace Stackra\Routing\Attributes;

use Attribute;
use Spatie\RouteAttributes\Attributes\Middleware as SpatieMiddleware;

/**
 * Apply middleware to routes.
 *
 * Extends Spatie's Middleware attribute to apply one or more middleware
 * to routes or entire controllers.
 *
 * ## Purpose:
 * - Apply authentication, authorization, or other middleware
 * - Stack multiple middleware on routes
 * - Apply middleware at controller or method level
 *
 * ## Usage:
 * ```php
 * use Stackra\Routing\Attributes\Middleware;
 * use Stackra\Routing\Attributes\Get;
 *
 * // Single middleware
 * #[Middleware('auth')]
 * class UserController { }
 *
 * // Multiple middleware
 * #[Middleware(['auth', 'verified'])]
 * class AdminController { }
 *
 * // Method-level middleware
 * class PostController
 * {
 *     #[Get('/posts')]
 *     #[Middleware('cache:3600')]
 *     public function index() { }
 * }
 * ```
 *
 * @since 1.0.0
 */
#[Attribute(Attribute::TARGET_METHOD | Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
class Middleware extends SpatieMiddleware
{
    /**
     * Create a new Middleware attribute instance.
     *
     * @param  array<string>|string  $middleware  Middleware to apply (e.g., 'auth', ['auth', 'verified'])
     */
    public function __construct(
        array|string $middleware,
    ) {
        parent::__construct(
            middleware: $middleware
        );
    }
}
