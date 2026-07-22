<?php

/**
 * @file packages/backend/framework/database/src/Migrations/Exceptions/MigrationDependencyMissingException.php
 *
 * @description
 * Thrown when a `#[DependsOn]` attribute names a parent marker class
 * that no discovered marker corresponds to. Causes: typo in the FQCN,
 * missing marker class, package deleted without cleaning up the
 * `#[DependsOn]` references.
 *
 * @category Database
 *
 * @since    0.2.0
 */

declare(strict_types=1);

namespace Stackra\Database\Migrations\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * A `#[DependsOn]` references a marker class we can't resolve.
 *
 * The exception message names both:
 *   - The marker class carrying the bad `#[DependsOn]` (the child).
 *   - The FQCN string that failed to resolve (the missing parent).
 *
 * That's enough for operators to find + fix the reference without
 * grepping.
 */
final class MigrationDependencyMissingException extends Exception
{
    /**
     * Machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'database.migration_dependency_missing';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'database::errors.migration_dependency_missing';

    /**
     * Factory used by the resolver's verify path.
     *
     * @param  class-string  $childMarker    The marker declaring `#[DependsOn(...)]`.
     * @param  class-string  $missingParent  The FQCN that didn't resolve.
     */
    public static function of(string $childMarker, string $missingParent): self
    {
        return (new self(\sprintf(
            'Marker "%s" declares #[DependsOn(%s::class)] but no marker class carries `%s` — check for a typo, a deleted package, or a marker that was renamed without updating its downstream references.',
            $childMarker,
            $missingParent,
            $missingParent,
        )))->withContext([
            'child_marker'   => $childMarker,
            'missing_parent' => $missingParent,
        ]);
    }
}
