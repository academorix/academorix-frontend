<?php


/**
 * Defaults Attribute
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
use Spatie\RouteAttributes\Attributes\Defaults as SpatieDefaults;

/**
 * Set default values for route parameters.
 *
 * Extends Spatie's Defaults attribute to provide default values
 * for route parameters when they're not present in the URL.
 *
 * ## Purpose:
 * - Provide default values for optional parameters
 * - Simplify route definitions with common defaults
 * - Support backward compatibility
 *
 * ## Usage:
 * ```php
 * use Stackra\Routing\Attributes\Defaults;
 * use Stackra\Routing\Attributes\Get;
 *
 * class PostController
 * {
 *     #[Get('/posts/{status?}')]
 *     #[Defaults('status', 'published')]  // Default to 'published' if not provided
 *     public function index(string $status = 'published') { }
 *
 *     #[Get('/posts/{page?}')]
 *     #[Defaults('page', '1')]  // Default to page 1
 *     public function paginated(int $page = 1) { }
 * }
 * ```
 *
 * @since 1.0.0
 */
#[Attribute(Attribute::TARGET_METHOD | Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
class Defaults extends SpatieDefaults
{
    /**
     * Create a new Defaults attribute instance.
     *
     * @param  string  $param  Parameter name to set default for
     * @param  mixed  $value  Default value for the parameter
     */
    public function __construct(
        string $param,
        mixed $value,
    ) {
        parent::__construct(
            key: $param,
            value: $value
        );
    }
}
