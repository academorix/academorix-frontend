<?php

declare(strict_types=1);

use Academorix\Notifications\Contracts\Data\NotificationPreferenceInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `notification_preferences` table.
 *
 * Per-user opt-in per (category, channel) with quiet hours + digest
 * mode. NOT soft-deleted — hard-deleted on GDPR Art. 17 erasure.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(NotificationPreferenceInterface::TABLE, function (Blueprint $table): void {
            // Primary key — prefixed ULID `pref_<26 chars>`.
            $table->string(NotificationPreferenceInterface::ATTR_ID, 64)->primary();

            // Boundaries.
            $table->string(NotificationPreferenceInterface::ATTR_TENANT_ID, 64);
            $table->string(NotificationPreferenceInterface::ATTR_USER_ID, 64);

            // Identifying tuple.
            $table->string(NotificationPreferenceInterface::ATTR_CATEGORY_SLUG, 128);
            $table->string(NotificationPreferenceInterface::ATTR_CHANNEL, 32);

            // Toggle + digest.
            $table->boolean(NotificationPreferenceInterface::ATTR_ENABLED)->default(true);
            $table->string(NotificationPreferenceInterface::ATTR_DIGEST_MODE, 32)->default('immediate');

            // Quiet hours — inclusive range in the user's timezone.
            $table->string(NotificationPreferenceInterface::ATTR_QUIET_HOURS_START, 8)->nullable();
            $table->string(NotificationPreferenceInterface::ATTR_QUIET_HOURS_END, 8)->nullable();
            $table->string(NotificationPreferenceInterface::ATTR_QUIET_HOURS_TIMEZONE, 64)->nullable();

            // Free-form metadata.
            $table->jsonb(NotificationPreferenceInterface::ATTR_METADATA)->nullable();

            // Userstamps + timestamps. NO soft delete on this table.
            $table->uuid(NotificationPreferenceInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(NotificationPreferenceInterface::ATTR_UPDATED_BY)->nullable();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Uniqueness — one row per (tenant, user, category, channel).
            $table->unique(
                [
                    NotificationPreferenceInterface::ATTR_TENANT_ID,
                    NotificationPreferenceInterface::ATTR_USER_ID,
                    NotificationPreferenceInterface::ATTR_CATEGORY_SLUG,
                    NotificationPreferenceInterface::ATTR_CHANNEL,
                ],
                'notification_preferences_tuple_unique',
            );

            $table->index(
                [
                    NotificationPreferenceInterface::ATTR_TENANT_ID,
                    NotificationPreferenceInterface::ATTR_USER_ID,
                ],
                'notification_preferences_user_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(NotificationPreferenceInterface::TABLE);
    }
};
