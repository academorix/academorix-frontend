<?php

declare(strict_types=1);

use Stackra\Notifications\Contracts\Data\NotificationDigestInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `notification_digests` table.
 *
 * Batched digest of pending notifications (daily / weekly). Not
 * soft-deleted — transient batching state with 30-day retention.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(NotificationDigestInterface::TABLE, function (Blueprint $table): void {
            // Primary key — prefixed ULID `dgst_<26 chars>`.
            $table->string(NotificationDigestInterface::ATTR_ID, 64)->primary();

            // Boundaries.
            $table->string(NotificationDigestInterface::ATTR_TENANT_ID, 64);
            $table->string(NotificationDigestInterface::ATTR_USER_ID, 64);

            // Identifying tuple.
            $table->string(NotificationDigestInterface::ATTR_CATEGORY_SLUG, 128);
            $table->string(NotificationDigestInterface::ATTR_CHANNEL, 32);

            // Lifecycle.
            $table->string(NotificationDigestInterface::ATTR_STATE, 32)->default('pending');
            $table->timestampTz(NotificationDigestInterface::ATTR_SCHEDULED_FOR);
            $table->timestampTz(NotificationDigestInterface::ATTR_DELIVERED_AT)->nullable();

            // Batch contents.
            $table->jsonb(NotificationDigestInterface::ATTR_NOTIFICATION_IDS)->nullable();

            // Free-form metadata.
            $table->jsonb(NotificationDigestInterface::ATTR_METADATA)->nullable();

            // Userstamps + timestamps. NO soft delete — 30-day hard purge.
            $table->uuid(NotificationDigestInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(NotificationDigestInterface::ATTR_UPDATED_BY)->nullable();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Bucket lookup — one bucket per (tenant, user, category,
            // channel, scheduled_for) while pending.
            $table->index(
                [
                    NotificationDigestInterface::ATTR_TENANT_ID,
                    NotificationDigestInterface::ATTR_USER_ID,
                    NotificationDigestInterface::ATTR_CATEGORY_SLUG,
                    NotificationDigestInterface::ATTR_CHANNEL,
                    NotificationDigestInterface::ATTR_SCHEDULED_FOR,
                ],
                'notification_digests_bucket_index',
            );

            $table->index(
                [
                    NotificationDigestInterface::ATTR_STATE,
                    NotificationDigestInterface::ATTR_SCHEDULED_FOR,
                ],
                'notification_digests_due_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(NotificationDigestInterface::TABLE);
    }
};
