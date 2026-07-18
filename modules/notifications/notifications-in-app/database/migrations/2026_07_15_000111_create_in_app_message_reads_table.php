<?php

/**
 * @file modules/notifications/notifications-in-app/database/migrations/2026_07_15_000111_create_in_app_message_reads_table.php
 *
 * @description
 * Create the `in_app_message_reads` table.
 *
 * Per-user read / dismissed state for an
 * {@see \Academorix\Notifications\InApp\Models\InAppMessage} row. One
 * row per `(in_app_message_id, addressee_id)`. Sibling table (not
 * columns on `in_app_messages`) so the message row stays immutable
 * and concurrency-safe.
 *
 * Cascading FK to `in_app_messages` — when a message is hard-purged
 * past retention, every read-state row goes with it.
 */

declare(strict_types=1);

use Academorix\Notifications\InApp\Contracts\Data\InAppMessageInterface;
use Academorix\Notifications\InApp\Contracts\Data\InAppMessageReadInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `in_app_message_reads` table.
 */
return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::create(InAppMessageReadInterface::TABLE, function (Blueprint $table): void {
            // Prefixed ULID `iar_<26 chars>`.
            $table->string(InAppMessageReadInterface::ATTR_ID, 64)->primary();

            $table->string(InAppMessageReadInterface::ATTR_TENANT_ID, 64);

            $table->string(InAppMessageReadInterface::ATTR_IN_APP_MESSAGE_ID, 64);
            $table->foreign(InAppMessageReadInterface::ATTR_IN_APP_MESSAGE_ID)
                ->references(InAppMessageInterface::ATTR_ID)
                ->on(InAppMessageInterface::TABLE)
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(InAppMessageReadInterface::ATTR_ADDRESSEE_ID, 64);
            $table->string(InAppMessageReadInterface::ATTR_ADDRESSEE_TYPE, 191);

            $table->timestampTz(InAppMessageReadInterface::ATTR_READ_AT)->nullable();
            $table->timestampTz(InAppMessageReadInterface::ATTR_DISMISSED_AT)->nullable();

            $table->jsonb(InAppMessageReadInterface::ATTR_METADATA)->nullable();

            $table->uuid(InAppMessageReadInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(InAppMessageReadInterface::ATTR_UPDATED_BY)->nullable();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // At most one read-state row per (message, addressee).
            $table->unique(
                [
                    InAppMessageReadInterface::ATTR_IN_APP_MESSAGE_ID,
                    InAppMessageReadInterface::ATTR_ADDRESSEE_ID,
                ],
                'in_app_message_reads_dedup_uq',
            );

            // Unread-count scan: WHERE tenant_id = ? AND addressee_id = ? AND read_at IS NULL.
            $table->index(
                [
                    InAppMessageReadInterface::ATTR_TENANT_ID,
                    InAppMessageReadInterface::ATTR_ADDRESSEE_ID,
                    InAppMessageReadInterface::ATTR_READ_AT,
                ],
                'in_app_message_reads_unread_scan_idx',
            );
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(InAppMessageReadInterface::TABLE);
    }
};
