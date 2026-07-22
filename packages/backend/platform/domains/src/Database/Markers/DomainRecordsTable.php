<?php

/**
 * @file Database/Markers/DomainRecordsTable.php
 *
 * @description
 * Migration marker for the `domain_records` table. Discovered at boot by
 * {@see \Stackra\Database\Migrations\MigrationDagResolver} —
 * every downstream marker that references THIS one via
 * `#[DependsOn(DomainRecordsTable::class)]` must run AFTER the migration
 * named in the MIGRATION constant.
 *
 * ## What this marker declares
 *
 *   * `MIGRATION` — the timestamped migration file that CREATES
 *     `domain_records`. The resolver uses this as a tiebreaker among
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

namespace Stackra\Domains\Database\Markers;

use Stackra\Database\Attributes\DependsOn;

final class DomainRecordsTable
{
    /** Migration file that produces this table. */
    public const string MIGRATION = '2026_07_15_000021_create_domain_records_table.php';

    /** Physical table name. */
    public const string TABLE = 'domain_records';
}
