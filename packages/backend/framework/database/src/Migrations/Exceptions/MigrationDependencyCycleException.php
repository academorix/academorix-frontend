<?php

/**
 * @file packages/backend/framework/database/src/Migrations/Exceptions/MigrationDependencyCycleException.php
 *
 * @description
 * Thrown when the `#[DependsOn]` graph contains a directed cycle. A
 * cycle is unresolvable — there's no valid migration order that
 * satisfies "A must run after B" AND "B must run after A". The
 * exception message names the full cycle path so operators can
 * locate + break the offending edge.
 *
 * @category Database
 *
 * @since    0.2.0
 */

declare(strict_types=1);

namespace Stackra\Database\Migrations\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * The `#[DependsOn]` graph contains a cycle.
 *
 * Kahn's algorithm reports this as "the graph still has vertices with
 * no incoming edges removed at the end of the sort". We capture the
 * remaining vertices + their induced sub-graph in the context so the
 * operator sees which markers participated.
 */
final class MigrationDependencyCycleException extends Exception
{
    /**
     * Machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'database.migration_dependency_cycle';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'database::errors.migration_dependency_cycle';

    /**
     * Factory used by the resolver's topological-sort path.
     *
     * @param  list<class-string>  $cyclePath  The markers involved in the cycle,
     *                                          in an order that closes back on
     *                                          itself. Length >= 2.
     */
    public static function of(array $cyclePath): self
    {
        $rendered = \implode(' → ', $cyclePath) . ' → ' . ($cyclePath[0] ?? '?');

        return (new self(\sprintf(
            'Migration dependency cycle detected: %s. A cycle is unresolvable — every edge in the path must be validated + one edge must be removed or inverted for the DAG to run.',
            $rendered,
        )))->withContext([
            'cycle'        => $cyclePath,
            'cycle_length' => \count($cyclePath),
        ]);
    }
}
