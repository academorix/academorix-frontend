<?php

/**
 * @file src/Exceptions/ScopeNotFoundException.php
 *
 * @description
 * Raised when a lookup by id / slug / entity id returns nothing.
 * Kept distinct from Laravel's model-not-found exception because
 * scope lookups often use materialised-path prefixes and slugs that
 * the default HTTP-exception mapping doesn't understand.
 */

declare(strict_types=1);

namespace Stackra\Scope\Exceptions;

/**
 * A referenced scope entity does not exist.
 *
 * Covers three cases:
 *
 *   1. Reference to a `scope_nodes.id` that doesn't exist.
 *   2. Reference to a `scope_definitions.slug` that isn't defined
 *      for the given owner.
 *   3. `scope_values` fetch for a `(node, namespace, key)` combo
 *      whose node itself is missing.
 */
final class ScopeNotFoundException extends ScopeException
{
    public static function node(string $nodeId): self
    {
        return new self(
            \sprintf('Scope node "%s" does not exist.', $nodeId),
        );
    }

    public static function definition(string $ownerId, string $slug): self
    {
        return new self(
            \sprintf(
                'Scope definition "%s" is not defined for owner "%s".',
                $slug,
                $ownerId,
            ),
        );
    }
}
