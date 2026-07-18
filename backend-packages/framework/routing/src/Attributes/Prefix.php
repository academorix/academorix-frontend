<?php


/**
 * Prefix Attribute
 *
 * PHP 8 attribute for compile-time metadata annotation in the Framework module.
 * Discovered by the compiler to configure runtime behavior automatically.
 *
 * @category Attributes
 *
 * @since    1.0.0
 */
namespace Academorix\Routing\Attributes;

use Attribute;
use Spatie\RouteAttributes\Attributes\Prefix as SpatiePrefix;

/**
 * Add a prefix to route URIs.
 *
 * Extends Spatie's Prefix attribute to add a prefix to all routes
 * in a controller or specific route methods.
 *
 * ## Purpose:
 * - Add a common prefix to all routes in a controller
 * - Organize routes under a common path segment
 * - Support nested resource structures
 *
 * ## Usage:
 * ```php
 * use Academorix\Routing\Attributes\Prefix;
 * use Academorix\Routing\Attributes\Get;
 *
 * #[Prefix('admin')]
 * class AdminController
 * {
 *     #[Get('/dashboard')]  // Results in: /admin/dashboard
 *     public function dashboard() { }
 * }
 * ```
 *
 * @since 1.0.0
 */
#[Attribute(Attribute::TARGET_METHOD | Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
class Prefix extends SpatiePrefix {}
