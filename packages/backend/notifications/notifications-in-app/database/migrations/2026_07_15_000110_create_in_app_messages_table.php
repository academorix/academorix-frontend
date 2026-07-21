<?php

/**
 * @file modules/notifications/notifications-in-app/database/migrations/2026_07_15_000110_create_in_app_messages_table.php
 *
 * @description
 * Create the `in_app_messages` table.
 *
 * Denormalised inbox row for the user's bell UI. Carries a snapshot
 * of the parent {@see \Stackra\Notifications\Models\Notification}'s
 * summary fields so the inbox list can render without a join.
 *
 * Composite indexes on `(tenant_id, addressee_id, created_at)` for
 * the primary inbox pagination read + `(tenant_id, notification_id)`
 * for the fan-out dedup guard.
 */

declare(strict_types=1);

use Stackra\Notifications\InApp\Contracts\Data\InAppMessageInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `in_app_messages` table.
 */
return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::create(InAppMessageInterface::TABLE, function (Blueprint $table): void {
            // Prefixed ULID `iam_<26 chars>`.
            $table->string(InAppMessageInterface::ATTR_ID, 64)->primary();

            $table->string(InAppMessageInterface::ATTR_TENANT_ID, 64);
            $table->string(InAppMessageInterface::ATTR_APPLICATION_ID, 64)->nullable();
            $table->string(InAppMessageInterface::ATTR_NOTIFICATION_ID, 64);

            // Polymorphic addressee — usually a User, but the schema
            // stays open so app-specific consumers can address other
            // types (a service account, a webhook receiver).
            $table->string(InAppMessageInterface::ATTR_ADDRESSEE_ID, 64);
            $table->string(InAppMessageInterface::ATTR_ADDRESSEE_TYPE, 191);

            $table->string(InAppMessageInterface::ATTR_CATEGORY_SLUG, 191);
            $table->string(InAppMessageInterface::ATTR_PRIORITY, 32);

            // Snapshot fields — copied from the parent notification
            // so the inbox list renders without a join.
            $table->string(InAppMessageInterface::ATTR_TITLE, 191);
            $table->text(InAppMessageInterface::ATTR_BODY_PREVIEW)->nullable();
            $table->string(InAppMessageInterface::ATTR_ACTION_URL, 2048)->nullable();
            $table->string(InAppMessageInterface::ATTR_ICON, 191)->nullable();

            $table->jsonb(InAppMessageInterface::ATTR_PAYLOAD)->nullable();

            $table->timestampTz(InAppMessageInterface::ATTR_DELIVERED_AT)->nullable();
            $table->jsonb(InAppMessageInterface::ATTR_METADATA)->nullable();

            $table->uuid(InAppMessageInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(InAppMessageInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(InAppMessageInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Primary inbox read path — bell list pagination.
            $table->index(
                [
                    InAppMessageInterface::ATTR_TENANT_ID,
                    InAppMessageInterface::ATTR_ADDRESSEE_ID,
                    InAppMessageInterface::ATTR_CREATED_AT,
                ],
                'in_app_messages_tenant_addressee_time_idx',
            );

            // Fan-out dedup: at most one message row per
            // (tenant, notification, addressee).
            $table->unique(
                [
                    InAppMessageInterface::ATTR_TENANT_ID,
                    InAppMessageInterface::ATTR_NOTIFICATION_ID,
                    InAppMessageInterface::ATTR_ADDRESSEE_ID,
                ],
                'in_app_messages_dedup_uq',
            );

            // Filter facet — inbox filtered by category.
            $table->index(
                [
                    InAppMessageInterface::ATTR_TENANT_ID,
                    InAppMessageInterface::ATTR_CATEGORY_SLUG,
                ],
                'in_app_messages_tenant_category_idx',
            );
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(InAppMessageInterface::TABLE);
    }
};
