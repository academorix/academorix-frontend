<?php

/**
 * @file Database/Markers/SearchSavedQueriesTable.php
 *
 * @description
 * Migration marker for the `search_saved_queries` table. Discovered at boot by
 * {@see \Stackra\Database\Migrations\MigrationDagResolver} —
 * every downstream marker that references THIS one via
 * `#[DependsOn(SearchSavedQueriesTable::class)]` must run AFTER the migration
 * named in the MIGRATION constant.
 *
 * ## What this marker declares
 *
 *   * `MIGRATION` — the timestamped migration file that CREATES
 *     `search_saved_queries`. The resolver uses this as a tiebreaker among
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

namespace Stackra\Search\Database\Markers;

use Stackra\Database\Attributes\DependsOn;

final class SearchSavedQueriesTable
{
    /** Migration file that produces this table. */
    public const string MIGRATION = '2026_07_15_000103_create_search_saved_queries_table.php';

    /** Physical table name. */
    public const string TABLE = 'search_saved_queries';
}
