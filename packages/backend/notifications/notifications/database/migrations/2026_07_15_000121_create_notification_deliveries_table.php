<?php

declare(strict_types=1);

use Stackra\Notifications\Contracts\Data\NotificationDeliveryInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `notification_deliveries` table.
 *
 * Per-channel delivery attempt for a parent Notification. Retries
 * create a new row with an incremented `attempt` counter.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(NotificationDeliveryInterface::TABLE, function (Blueprint $table): void {
            // Primary key — prefixed ULID `delv_<26 chars>`.
            $table->string(NotificationDeliveryInterface::ATTR_ID, 64)->primary();

            // Boundaries.
            $table->string(NotificationDeliveryInterface::ATTR_TENANT_ID, 64)->index();
            $table->string(NotificationDeliveryInterface::ATTR_NOTIFICATION_ID, 64);

            // Channel + provider metadata.
            $table->string(NotificationDeliveryInterface::ATTR_CHANNEL, 32);
            $table->string(NotificationDeliveryInterface::ATTR_PROVIDER, 64)->nullable();
            $table->string(NotificationDeliveryInterface::ATTR_PROVIDER_MESSAGE_ID, 191)->nullable();

            // Lifecycle state.
            $table->string(NotificationDeliveryInterface::ATTR_STATE, 32);
            $table->integer(NotificationDeliveryInterface::ATTR_ATTEMPT)->default(1);

            // Timeline.
            $table->timestampTz(NotificationDeliveryInterface::ATTR_ATTEMPTED_AT)->nullable();
            $table->timestampTz(NotificationDeliveryInterface::ATTR_DELIVERED_AT)->nullable();
            $table->timestampTz(NotificationDeliveryInterface::ATTR_FAILED_AT)->nullable();
            $table->timestampTz(NotificationDeliveryInterface::ATTR_OPENED_AT)->nullable();
            $table->string(NotificationDeliveryInterface::ATTR_OPENED_IP, 45)->nullable();
            $table->string(NotificationDeliveryInterface::ATTR_OPENED_USER_AGENT, 500)->nullable();
            $table->timestampTz(NotificationDeliveryInterface::ATTR_LAST_CLICK_AT)->nullable();

            // Error state.
            $table->string(NotificationDeliveryInterface::ATTR_ERROR_CODE, 128)->nullable();
            $table->text(NotificationDeliveryInterface::ATTR_ERROR_MESSAGE)->nullable();
            $table->integer(NotificationDeliveryInterface::ATTR_RETRY_COUNT)->default(0);
            $table->timestampTz(NotificationDeliveryInterface::ATTR_NEXT_RETRY_AT)->nullable();

            // Cost accounting.
            $table->integer(NotificationDeliveryInterface::ATTR_COST_MICRO_UNITS)->nullable();

            // Free-form metadata.
            $table->jsonb(NotificationDeliveryInterface::ATTR_METADATA)->nullable();

            // Userstamps + timestamps + soft delete.
            $table->uuid(NotificationDeliveryInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(NotificationDeliveryInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(NotificationDeliveryInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            $table->index(
                [
                    NotificationDeliveryInterface::ATTR_NOTIFICATION_ID,
                    NotificationDeliveryInterface::ATTR_ATTEMPT,
                ],
                'nd_notification_attempt_index',
            );

            $table->index(
                [NotificationDeliveryInterface::ATTR_CHANNEL, NotificationDeliveryInterface::ATTR_STATE],
                'nd_channel_state_index',
            );

            $table->index(
                NotificationDeliveryInterface::ATTR_NEXT_RETRY_AT,
                'nd_next_retry_at_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(NotificationDeliveryInterface::TABLE);
    }
};
