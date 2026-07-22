<?php

/**
 * @file Database/Markers/FeatureDefinitionsTable.php
 *
 * @description
 * Migration marker for the `feature_definitions` table. Discovered at boot by
 * {@see \Stackra\Database\Migrations\MigrationDagResolver} —
 * every downstream marker that references THIS one via
 * `#[DependsOn(FeatureDefinitionsTable::class)]` must run AFTER the migration
 * named in the MIGRATION constant.
 *
 * ## What this marker declares
 *
 *   * `MIGRATION` — the timestamped migration file that CREATES
 *     `feature_definitions`. The resolver uses this as a tiebreaker among
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

namespace Stackra\FeatureFlags\Database\Markers;

use Stackra\Database\Attributes\DependsOn;

final class FeatureDefinitionsTable
{
    /** Migration file that produces this table. */
    public const string MIGRATION = '2025_11_01_000001_create_feature_definitions_table.php';

    /** Physical table name. */
    public const string TABLE = 'feature_definitions';
}
