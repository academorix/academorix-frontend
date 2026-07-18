<?php

/**
 * @file modules/shared/activity/database/migrations/2026_07_15_000090_add_tenant_id_to_activity_log_table.php
 *
 * @description
 * Add `tenant_id` to spatie's `activity_log` table.
 *
 * spatie/laravel-activitylog ships its own `create_activity_log_table`
 * migration under `2018_08_08_100000_...` — every LoadsResources loop
 * runs vendor migrations first (filename ordering), so this migration
 * (dated 2026-07-15) always runs AFTER spatie's own. We add the
 * `tenant_id` column + a composite index for the primary read path
 * (feed pagination scoped to a tenant).
 *
 * Rationale: per `.kiro/steering/tenancy-columns.md` §3 gap #2, the
 * vendor `activity_log` table ships without a `tenant_id` column and
 * downstream compliance queries currently extract tenant id from the
 * `properties` JSON blob — this prevents indexing. This migration
 * closes that gap.
 */

declare(strict_types=1);

use Academorix\Activity\Contracts\Data\ActivityInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ALTER migration extending spatie's `activity_log` schema.
 */
return new class() extends Migration
{
    /**
     * Add the `tenant_id` column + composite index.
     */
    public function up(): void
    {
        $table = (string) \config('activity.table_name', ActivityInterface::TABLE);

        Schema::table($table, function (Blueprint $blueprint): void {
            // Nullable — system-level rows (deploys, seeders, console
            // commands running outside a tenant context) legitimately
            // carry `null`. Length 64 matches every other prefixed
            // ULID column in the schema.
            $blueprint->string(ActivityInterface::ATTR_TENANT_ID, 64)
                ->nullable()
                ->after(ActivityInterface::ATTR_ID);

            // Primary read path — tenant feed pagination:
            // `WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 50`.
            $blueprint->index(
                [ActivityInterface::ATTR_TENANT_ID, ActivityInterface::ATTR_CREATED_AT],
                'activity_log_tenant_time_idx',
            );
        });
    }

    /**
     * Reverse — drop the index first, then the column (PG constraint).
     */
    public function down(): void
    {
        $table = (string) \config('activity.table_name', ActivityInterface::TABLE);

        Schema::table($table, function (Blueprint $blueprint): void {
            $blueprint->dropIndex('activity_log_tenant_time_idx');
            $blueprint->dropColumn(ActivityInterface::ATTR_TENANT_ID);
        });
    }
};
