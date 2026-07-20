<?php


/**
 * Domain Attribute
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
use Spatie\RouteAttributes\Attributes\Domain as SpatieDomain;

/**
 * Specify the domain for the route.
 *
 * Extends Spatie's Domain attribute to constrain routes to a specific domain.
 * Useful for multi-tenant applications or subdomain routing.
 *
 * ## Purpose:
 * - Constrain routes to specific domains or subdomains
 * - Support multi-tenant applications
 * - Enable subdomain-based routing
 *
 * ## Usage:
 * ```php
 * use Academorix\Routing\Attributes\Domain;
 * use Academorix\Routing\Attributes\Get;
 *
 * // Fixed domain
 * #[Domain('admin.example.com')]
 * class AdminController { }
 *
 * // Dynamic subdomain
 * #[Domain('{account}.example.com')]
 * class TenantController
 * {
 *     #[Get('/dashboard')]
 *     public function dashboard(string $account) { }
 * }
 * ```
 *
 * @since 1.0.0
 */
#[Attribute(Attribute::TARGET_METHOD | Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
class Domain extends SpatieDomain {}
