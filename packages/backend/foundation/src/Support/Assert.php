<?php

/**
 * @file packages/foundation/src/Support/Assert.php
 *
 * @description
 * Guard-clause helpers for defensive checks at the top of methods.
 * Throws `\InvalidArgumentException` on failure — a plain SPL type,
 * chosen deliberately so `foundation` can stay independent of
 * `stackra/exceptions` (which depends on foundation itself).
 *
 * The exceptions package layers its own richer guards on top of these
 * (`Stackra\Exceptions\Guard::...`) that throw
 * `InvariantViolationException` with structured context. Use those in
 * domain code. Use `Assert::...` in leaf utilities that must not pull
 * in the exceptions package.
 *
 *   Assert::notEmpty($name, 'name');
 *   Assert::stringLength($slug, min: 3, max: 64, argument: 'slug');
 *   Assert::inRange($age, 0, 130, 'age');
 *
 * All guards return `void`; if the assertion holds, the caller
 * continues.
 */

declare(strict_types=1);

namespace Stackra\Foundation\Support;

use InvalidArgumentException;

final class Assert
{
    /** @param mixed $value */
    public static function notNull($value, string $argument): void
    {
        if ($value === null) {
            throw new InvalidArgumentException("Argument \"{$argument}\" MUST NOT be null.");
        }
    }

    public static function notEmpty(?string $value, string $argument): void
    {
        if ($value === null || trim($value) === '') {
            throw new InvalidArgumentException("Argument \"{$argument}\" MUST NOT be empty.");
        }
    }

    public static function stringLength(
        string $value,
        int $min = 0,
        ?int $max = null,
        string $argument = 'value',
    ): void {
        $length = mb_strlen($value);

        if ($length < $min) {
            throw new InvalidArgumentException("Argument \"{$argument}\" is shorter than the minimum ({$min}).");
        }

        if ($max !== null && $length > $max) {
            throw new InvalidArgumentException("Argument \"{$argument}\" exceeds the maximum length ({$max}).");
        }
    }

    public static function inRange(int|float $value, int|float $min, int|float $max, string $argument = 'value'): void
    {
        if ($value < $min || $value > $max) {
            throw new InvalidArgumentException("Argument \"{$argument}\" must be between {$min} and {$max}.");
        }
    }

    /**
     * @param list<mixed> $allowed
     */
    public static function oneOf(mixed $value, array $allowed, string $argument = 'value'): void
    {
        if (! in_array($value, $allowed, true)) {
            $rendered = implode(', ', array_map(static fn ($v): string => is_scalar($v) ? (string) $v : gettype($v), $allowed));
            throw new InvalidArgumentException("Argument \"{$argument}\" must be one of [{$rendered}].");
        }
    }

    public static function matches(string $value, string $pattern, string $argument = 'value'): void
    {
        if (preg_match($pattern, $value) !== 1) {
            throw new InvalidArgumentException("Argument \"{$argument}\" does not match pattern {$pattern}.");
        }
    }

    /**
     * Generic "this must be true" guard for expressions that don't fit
     * the other helpers.
     */
    public static function that(bool $condition, string $message): void
    {
        if (! $condition) {
            throw new InvalidArgumentException($message);
        }
    }
}
