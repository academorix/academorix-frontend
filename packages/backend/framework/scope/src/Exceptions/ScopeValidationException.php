<?php

/**
 * @file src/Exceptions/ScopeValidationException.php
 *
 * @description
 * Thrown when a value or identifier fails a validation gate before
 * touching persistence. Covers three distinct call sites:
 *
 *   1. Namespace slug does not match `scope.namespace_regex`.
 *   2. A consumer's `ScopeConsumerConfig::$validator` returned
 *      `false` for a write.
 *   3. Definition-write introduces a cycle in the parent-slug
 *      graph.
 */

declare(strict_types=1);

namespace Academorix\Scope\Exceptions;

/**
 * Client-visible validation failure.
 *
 * HTTP callers should render this as a 422 with the message
 * verbatim — the exception message is safe for public exposure
 * because it never leaks internal identifiers or secrets.
 */
final class ScopeValidationException extends ScopeException
{
    public static function invalidNamespace(string $namespace, string $regex): self
    {
        return new self(
            \sprintf(
                'Invalid scope namespace "%s". Must match %s.',
                $namespace,
                $regex,
            ),
        );
    }

    public static function rejectedByValidator(string $namespace, string $key): self
    {
        return new self(
            \sprintf(
                'Value for "%s/%s" rejected by the consumer validator.',
                $namespace,
                $key,
            ),
        );
    }

    public static function cycleDetected(string $slug): self
    {
        return new self(
            \sprintf(
                'Cycle detected in scope definition tree — "%s" is an '
                .'ancestor of itself.',
                $slug,
            ),
        );
    }
}
