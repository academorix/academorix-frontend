<?php

/**
 * @file Database/Markers/PassesTable.php
 *
 * @description
 * Migration marker for the `passes` table. Discovered at boot by
 * {@see \Stackra\Database\Migrations\MigrationDagResolver} —
 * every downstream marker that references THIS one via
 * `#[DependsOn(PassesTable::class)]` must run AFTER the migration
 * named in the MIGRATION constant.
 *
 * ## What this marker declares
 *
 *   * `MIGRATION` — the timestamped migration file that CREATES
 *     `passes`. The resolver uses this as a tiebreaker among
 *     markers at the same DAG depth.
 *   * `TABLE`     — the physical table name, matches the migration
 *     file's slug.
 *   * `#[DependsOn(...)]` — one attribute per parent table this
 *     marker's migration FKs into. See ADR-0035 §D1 for the
 *     rationale.
 *
 * ## Related
 *
 *   * ADR-0035 — Migration dependency ordering.
 *   * `.kiro/steering/models.md §Migration ordering`.
 *
 * @category Database
 *
 * @since    0.2.0
 */

declare(strict_types=1);

namespace Academorix\Membership\Database\Markers;

use Stackra\Database\Attributes\DependsOn;

final class PassesTable
{
    /** Migration file that produces this table. */
    public const string MIGRATION = '2026_07_15_120003_create_passes_table.php';

    /** Physical table name. */
    public const string TABLE = 'passes';
}
