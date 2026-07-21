<?php

declare(strict_types=1);

/**
 * Callable Cases Trait
 *
 * Provides reusable Callable Cases behavior for classes in the Framework module.
 * Extracted as a trait to share functionality across multiple classes.
 *
 * @category Concerns
 *
 * @since    1.0.0
 */
namespace Stackra\Enum\Concerns;

use BackedEnum;
use Stackra\Enum\Exceptions\UndefinedCaseException;
use Stackra\Support\Reflection;

/**
 * Invokable Cases Trait.
 *
 * Allows enum cases to be invoked as methods, returning their value or name.
 *
 * ## Features:
 * - Call cases statically: `MyEnum::CASE()` returns the value
 * - Invoke instances: `$enum()` returns the value
 * - Works with both backed and pure enums
 *
 * ## Usage:
 * ```php
 * enum Status: string
 * {
 *     use CallableCases;
 *
 *     case ACTIVE = 'active';
 *     case INACTIVE = 'inactive';
 * }
 *
 * Status::ACTIVE();  // Returns 'active'
 * $status = Status::ACTIVE();
 * $status();         // Returns 'active'
 * ```
 *
 * @author  Stackra Development Team
 *
 * @since   1.0.0
 */
trait CallableCases
{
    /**
     * Return the enum's value when it's invoked as a function.
     *
     * For backed enums, returns the value. For pure enums, returns the name.
     *
     * @return mixed The enum value or name
     */
    public function __invoke(): mixed
    {
        return Reflection::implements($this, BackedEnum::class) ? $this->value : $this->name;
    }

    /**
     * Return the enum's value or name when called statically.
     *
     * This magic method allows calling enum cases as static methods:
     * `MyEnum::CASE()` instead of `MyEnum::CASE->value`
     *
     * @param  string  $name  The case name
     * @param  array<mixed>  $args  Arguments (unused)
     * @return mixed The enum value or name
     *
     * @throws UndefinedCaseException If the case doesn't exist
     */
    public static function __callStatic(string $name, array $args): mixed
    {
        $cases = static::cases();

        foreach ($cases as $case) {
            if ($case->name === $name) {
                return Reflection::implements($case, BackedEnum::class) ? $case->value : $case->name;
            }
        }

        throw new UndefinedCaseException(static::class, $name);
    }
}
