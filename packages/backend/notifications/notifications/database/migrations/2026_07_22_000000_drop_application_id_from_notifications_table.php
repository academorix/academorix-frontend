<?php

/**
 * @file packages/backend/notifications/notifications/database/migrations/2026_07_22_000000_drop_application_id_from_notifications_table.php
 *
 * @description
 * Drop `application_id` from the `notifications` table per ADR-0031 §D3.
 *
 * The `notifications` row cascades through its legitimate parent — no attribution
 * is lost by removing the direct `application_id` column. Every downstream
 * consumer that used to read `$row->application_id` reads through the
 * parent relationship instead.
 *
 * No composite index depends on application_id for this row — the column drops cleanly on its own.
 *
 * ## Related
 *
 *   * ADR-0031 §D3 — the mandate this migration executes.
 *   * `.kiro/steering/tenancy-columns.md §2` — the 12-row named list that
 *     excludes this row.
 *   * `.kiro/steering/tenancy-columns.md §9b` — the closed-rows register
 *     the auditor reads.
 */

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Stackra\Notifications\Contracts\Data\NotificationInterface;

return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::table(NotificationInterface::TABLE, function (Blueprint $table): void {
            // No dependent index — the column drops cleanly on its own.
            // Application cascades through the row's legitimate parent
            // (see ADR-0031 §D3 for the cascade path per row).
            $table->dropColumn(NotificationInterface::ATTR_APPLICATION_ID);
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::table(NotificationInterface::TABLE, function (Blueprint $table): void {
            // Reverse of up(): restore the column with the original nullable
            // shape. Populating rows is out of scope — up() zeroed the column;
            // down() only restores the definition.
            $table->uuid(NotificationInterface::ATTR_APPLICATION_ID)->nullable();
            $table->index([NotificationInterface::ATTR_APPLICATION_ID]);
        });
    }
};
