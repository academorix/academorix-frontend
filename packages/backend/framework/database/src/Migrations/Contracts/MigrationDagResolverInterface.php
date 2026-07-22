<?php

/**
 * @file packages/backend/framework/database/src/Migrations/Contracts/MigrationDagResolverInterface.php
 *
 * @description
 * Contract for the migration dependency-graph resolver introduced by
 * ADR-0035. Consumers depend on the interface — the container binds
 * the concrete {@see \Stackra\Database\Migrations\MigrationDagResolver}
 * via `#[Bind]` on the concrete class. Tests swap in an in-memory
 * implementation with a fixed marker list to exercise the DAG logic
 * in isolation.
 *
 * @category Database
 *
 * @since    0.2.0
 */

declare(strict_types=1);

namespace Stackra\Database\Migrations\Contracts;

/**
 * Boot-time migration-dependency resolver.
 *
 * The resolver walks every `#[DependsOn]` on every marker class,
 * builds a DAG, then:
 *   * Verifies every parent reference resolves to a known marker.
 *   * Detects cycles.
 *   * Topologically sorts the marker list so every marker appears
 *     AFTER its parents.
 *
 * A fresh resolver is stateless — calling {@see resolve()} twice
 * returns the same list. Implementations cache internally when they
 * see fit; consumers make no assumption about cache lifetime.
 */
interface MigrationDagResolverInterface
{
    /**
     * Return the topologically-sorted list of marker FQCNs.
     *
     * Order guarantee: every marker appears AFTER every `#[DependsOn]`
     * parent it declares. Filename timestamps (via the marker's
     * `MIGRATION` const) are a stable tiebreaker for markers at the
     * same DAG depth.
     *
     * @return list<class-string>  Marker FQCNs in run order.
     *
     * @throws \Stackra\Database\Migrations\Exceptions\MigrationDependencyMissingException
     *     When any `#[DependsOn]` references a marker class that no
     *     `#[DependsOn]` hit corresponds to.
     * @throws \Stackra\Database\Migrations\Exceptions\MigrationDependencyCycleException
     *     When the graph contains a cycle. The exception message names
     *     the full cycle path so operators can locate the bad edge.
     */
    public function resolve(): array;

    /**
     * Return the ordered list of MIGRATION FILE NAMES.
     *
     * Convenience over {@see resolve()} — reads each marker's
     * `MIGRATION` const and returns those filenames in dependency
     * order. Matches the order Laravel's migrator would run when
     * ordered by this resolver.
     *
     * @return list<string>  Migration filenames (e.g.
     *                       `2026_07_15_120005_create_roles_table.php`).
     *
     * @throws \Stackra\Database\Migrations\Exceptions\MigrationDependencyMissingException
     * @throws \Stackra\Database\Migrations\Exceptions\MigrationDependencyCycleException
     */
    public function resolveMigrationFiles(): array;

    /**
     * Verify the DAG without returning the sorted list.
     *
     * Used by pre-migrate hooks + Pest tests: exercises the same
     * validation as {@see resolve()} but throws on ANY failure
     * (missing parent, cycle). Returns true on success — the return
     * value is a "verify passed" marker for chained assertions.
     *
     * @throws \Stackra\Database\Migrations\Exceptions\MigrationDependencyMissingException
     * @throws \Stackra\Database\Migrations\Exceptions\MigrationDependencyCycleException
     */
    public function verify(): bool;
}
