<?php

declare(strict_types=1);

/**
 * Valuable Trait
 *
 * Provides reusable Valuable behavior for classes in the Framework module.
 * Extracted as a trait to share functionality across multiple classes.
 *
 * @category Concerns
 *
 * @since    1.0.0
 */
namespace Stackra\Enum\Concerns;

use BackedEnum;
use Stackra\Support\Arr;
use Stackra\Support\Reflection;

/**
 * Valuable Trait.
 *
 * Provides a method to get an array of all case values.
 * For backed enums, returns the values. For pure enums, returns the names.
 *
 * ## Usage:
 * ```php
 * enum Status: string
 * {
 *     use Valuable;
 *
 *     case ACTIVE = 'active';
 *     case INACTIVE = 'inactive';
 *     case PENDING = 'pending';
 * }
 *
 * Status::values();  // Returns ['active', 'inactive', 'pending']
 * ```
 *
 * @author  Stackra Development Team
 *
 * @since   1.0.0
 */
trait Valuable
{
    /**
     * Get an array of all case values.
     *
     * For backed enums, returns the backing values.
     * For pure enums, returns the case names (same as names()).
     *
     * @return array<mixed> Array of case values
     */
    public static function values(): array
    {
        $cases = static::cases();

        return isset($cases[0]) && Reflection::implements($cases[0], BackedEnum::class)
            ? Arr::column($cases, 'value')
            : Arr::column($cases, 'name');
    }
}
