<?php

/**
 * @file packages/backend/framework/database/src/Attributes/DependsOn.php
 *
 * @description
 * `#[DependsOn]` attribute — declares a directed edge in the migration
 * dependency DAG resolved at boot by
 * {@see \Stackra\Database\Migrations\MigrationDagResolver}.
 *
 * The attribute is placed on **marker classes** (under a package's
 * `src/Database/Markers/` folder), NOT on migration files. Migration
 * files use anonymous classes that don't produce a stable FQCN for
 * `olvlvl/composer-attribute-collector` — markers are named classes
 * that DO. See ADR-0035 §D1 for the rationale.
 *
 * ## Usage
 *
 *   ```php
 *   // packages/backend/access/rbac/src/Database/Markers/RolesTable.php
 *
 *   #[DependsOn(TenantsTable::class)]
 *   #[DependsOn(ApplicationsTable::class)]
 *   final class RolesTable
 *   {
 *       public const string MIGRATION = '2026_07_15_120005_create_roles_table.php';
 *       public const string TABLE     = 'roles';
 *   }
 *   ```
 *
 * Every `#[DependsOn]` names ONE parent marker class. Repeatable —
 * a table with three parents ships three attribute instances.
 *
 * ## Cycle detection + fail-loud semantics
 *
 * The resolver runs a Kahn-style topological sort at boot. If any
 * `#[DependsOn]` names a marker class that no other marker
 * corresponds to (typo, missing marker, deleted package), boot fails
 * with {@see \Stackra\Database\Migrations\Exceptions\MigrationDependencyMissingException}.
 * If the graph contains a cycle, boot fails with
 * {@see \Stackra\Database\Migrations\Exceptions\MigrationDependencyCycleException}
 * — the exception message names the full cycle path.
 *
 * @see \Stackra\Database\Migrations\MigrationDagResolver Resolver.
 *
 * @category Database
 *
 * @since    0.2.0
 */

declare(strict_types=1);

namespace Stackra\Database\Attributes;

use Attribute;

/**
 * Declares that a table marker depends on another table marker.
 *
 * The `$parentMarker` MUST be a class-string of another
 * `#[DependsOn]`-marked marker class in the workspace. The resolver
 * builds the DAG from every `#[DependsOn]` hit + fails loudly on any
 * unresolved reference.
 *
 * `IS_REPEATABLE` — a table with multiple parents declares multiple
 * `#[DependsOn]` attributes.
 *
 * `TARGET_CLASS` — the attribute lives on marker classes, never on
 * methods / properties / parameters.
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final class DependsOn
{
    /**
     * @param  class-string  $parentMarker  FQCN of the parent marker
     *                                      class this marker depends
     *                                      on. Every downstream migration
     *                                      MUST run AFTER the parent's
     *                                      migration.
     */
    public function __construct(
        public readonly string $parentMarker,
    ) {}
}
