<?php

/**
 * @file packages/exceptions/src/Guard.php
 *
 * @description
 * Guard-clause helpers for domain code. Mirrors the surface of
 * {@see \Academorix\Foundation\Support\Assert} — same method names,
 * same argument order — but every failure throws a rich
 * {@see \Academorix\Exceptions\Domain\InvariantViolationException}
 * carrying structured `context` metadata (argument name, expected /
 * actual shape, whatever the caller passes along).
 *
 * ## When to use which
 *
 * - `Academorix\Exceptions\Guard::...` — inside domain code, use
 *   cases, aggregates, services. Failures here are bugs; the
 *   InvariantViolationException surfaces them with `severity =
 *   Critical` and enough context to reproduce.
 *
 * - `Academorix\Foundation\Support\Assert::...` — inside leaf
 *   utilities that must stay `foundation`-only (no dependency on
 *   `academorix/exceptions`). Failures throw a plain SPL
 *   `InvalidArgumentException` that any caller can catch without
 *   pulling in this package.
 *
 * ## Naming rationale
 *
 * `$argument` is typed loosely as `string` throughout — it's the
 * name of the argument being validated, echoed into both the
 * exception message and its `context['argument']` slot. We keep the
 * signature liberal (`mixed $value`) rather than PHP-narrowing
 * because the guards operate at the boundary where types haven't
 * been proven yet.
 */

declare(strict_types=1);

namespace Academorix\Exceptions;

use Academorix\Exceptions\Domain\InvariantViolationException;

final class Guard
{
    /**
     * Fail when `$value` is `null`.
     *
     * @param array<string, mixed> $context Extra metadata woven into the thrown exception.
     */
    public static function notNull(mixed $value, string $argument, array $context = []): void
    {
        if ($value === null) {
            throw self::fail(
                sprintf('%s: expected non-null value, got null.', $argument),
                $argument,
                $context,
            );
        }
    }

    /**
     * Fail when `$value` is `null`, an empty string / whitespace, or
     * an empty array. Non-null scalars other than the empty string
     * pass — matches `Assert::notEmpty`'s conservative shape.
     *
     * @param array<string, mixed> $context
     */
    public static function notEmpty(mixed $value, string $argument, array $context = []): void
    {
        // Order matters: null before is_string so `null` doesn't hit
        // the trim branch.
        $empty = $value === null
            || (is_string($value) && trim($value) === '')
            || (is_array($value) && $value === []);

        if ($empty) {
            throw self::fail(
                sprintf('%s: expected non-empty value.', $argument),
                $argument,
                $context,
            );
        }
    }

    /**
     * Fail when `$value` (measured with `mb_strlen`) is shorter than
     * `$min` or — when `$max` is provided — longer than `$max`.
     *
     * @param array<string, mixed> $context
     */
    public static function stringLength(
        string $value,
        int $min,
        ?int $max,
        string $argument,
        array $context = [],
    ): void {
        // Multibyte-aware length so emoji-heavy inputs don't trip on
        // byte counts. Anything Laravel accepts as "string" we accept.
        $length = mb_strlen($value);

        if ($length < $min) {
            throw self::fail(
                sprintf('%s: expected length >= %d, got %d.', $argument, $min, $length),
                $argument,
                [...$context, 'min' => $min, 'actual' => $length],
            );
        }

        if ($max !== null && $length > $max) {
            throw self::fail(
                sprintf('%s: expected length <= %d, got %d.', $argument, $max, $length),
                $argument,
                [...$context, 'max' => $max, 'actual' => $length],
            );
        }
    }

    /**
     * Fail when `$value` is below `$min` or above `$max` (inclusive
     * on both ends).
     *
     * @param array<string, mixed> $context
     */
    public static function inRange(
        int|float $value,
        int|float $min,
        int|float $max,
        string $argument,
        array $context = [],
    ): void {
        if ($value < $min || $value > $max) {
            throw self::fail(
                sprintf('%s: expected value in [%s, %s], got %s.', $argument, (string) $min, (string) $max, (string) $value),
                $argument,
                [...$context, 'min' => $min, 'max' => $max, 'actual' => $value],
            );
        }
    }

    /**
     * Fail when `$value` isn't one of the values listed in `$allowed`.
     * Comparison uses strict equality (`in_array(..., true)`) so a
     * numeric string won't sneak through against an int allow-list.
     *
     * @param list<mixed> $allowed
     * @param array<string, mixed> $context
     */
    public static function oneOf(
        mixed $value,
        array $allowed,
        string $argument,
        array $context = [],
    ): void {
        if (! in_array($value, $allowed, true)) {
            $rendered = implode(', ', array_map(
                static fn (mixed $v): string => is_scalar($v) ? (string) $v : get_debug_type($v),
                $allowed,
            ));

            throw self::fail(
                sprintf('%s: expected one of [%s], got %s.', $argument, $rendered, get_debug_type($value)),
                $argument,
                [...$context, 'allowed' => $allowed],
            );
        }
    }

    /**
     * Generic "this must be true" guard for expressions that don't
     * fit the other helpers. Prefer a more specific guard when one
     * applies — this one loses type info.
     *
     * @param array<string, mixed> $context
     */
    public static function that(bool $condition, string $message, array $context = []): void
    {
        if (! $condition) {
            throw InvariantViolationException::assertionFailed($message)
                ->withContext($context);
        }
    }

    /**
     * Common exit path — every specific guard funnels through here so
     * the exception carries a consistent shape:
     *
     *   - `message`: `"$argument: expected …"`
     *   - `context['argument']`: the offending argument name
     *   - `context[...]`: whatever extras the caller added
     *
     * @param array<string, mixed> $context
     */
    private static function fail(
        string $message,
        string $argument,
        array $context,
    ): InvariantViolationException {
        // `assertionFailed()` already populates `context.assertion`
        // with the raw message — we merge the caller's context on
        // top and add the argument name for indexability.
        return InvariantViolationException::assertionFailed($message)
            ->withContext([...$context, 'argument' => $argument]);
    }
}
