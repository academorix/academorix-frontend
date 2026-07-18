<?php

declare(strict_types=1);

use Academorix\Notifications\Contracts\Data\NotificationInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `notifications` table.
 *
 * The universal delivery record. Carries a denormalised addressee
 * snapshot at dispatch time — event-carried state so downstream
 * consumers never look the recipient up by id.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(NotificationInterface::TABLE, function (Blueprint $table): void {
            // Primary key — prefixed ULID `not_<26 chars>`.
            $table->string(NotificationInterface::ATTR_ID, 64)->primary();

            // Boundaries.
            $table->string(NotificationInterface::ATTR_TENANT_ID, 64)->index();
            $table->string(NotificationInterface::ATTR_APPLICATION_ID, 64)->nullable();
            $table->string(NotificationInterface::ATTR_TEMPLATE_ID, 64)->nullable();

            // Category + template resolution.
            $table->string(NotificationInterface::ATTR_CATEGORY_SLUG, 128);
            $table->string(NotificationInterface::ATTR_TEMPLATE_KEY, 128);

            // Priority + lifecycle state.
            $table->string(NotificationInterface::ATTR_PRIORITY, 32);
            $table->string(NotificationInterface::ATTR_STATE, 32);

            // Denormalised addressee snapshot.
            $table->string(NotificationInterface::ATTR_ADDRESSEE_TYPE, 32);
            $table->string(NotificationInterface::ATTR_ADDRESSEE_ID, 64)->nullable();
            $table->string(NotificationInterface::ATTR_ADDRESSEE_EMAIL, 320)->nullable();
            $table->string(NotificationInterface::ATTR_ADDRESSEE_PHONE, 32)->nullable();
            $table->string(NotificationInterface::ATTR_ADDRESSEE_NAME, 191);
            $table->string(NotificationInterface::ATTR_ADDRESSEE_LOCALE, 8);
            $table->string(NotificationInterface::ATTR_ADDRESSEE_TIMEZONE, 64);
            $table->string(NotificationInterface::ATTR_ADDRESSEE_CONSENT_GATE, 32)->nullable();

            // Actor.
            $table->string(NotificationInterface::ATTR_ACTOR_TYPE, 32)->default('system');
            $table->string(NotificationInterface::ATTR_ACTOR_ID, 64)->nullable();

            // Body.
            $table->text(NotificationInterface::ATTR_SUBJECT)->nullable();
            $table->jsonb(NotificationInterface::ATTR_PAYLOAD)->nullable();
            $table->jsonb(NotificationInterface::ATTR_PRIORITY_CHANNELS)->nullable();

            // Interaction state.
            $table->timestampTz(NotificationInterface::ATTR_SEEN_AT)->nullable();
            $table->timestampTz(NotificationInterface::ATTR_ARCHIVED_AT)->nullable();

            // Free-form metadata bag.
            $table->jsonb(NotificationInterface::ATTR_METADATA)->nullable();

            // Userstamps + timestamps + soft delete.
            $table->uuid(NotificationInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(NotificationInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(NotificationInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Inbox pagination: tenant + addressee + time.
            $table->index(
                [
                    NotificationInterface::ATTR_TENANT_ID,
                    NotificationInterface::ATTR_ADDRESSEE_ID,
                    NotificationInterface::ATTR_CREATED_AT,
                ],
                'notifications_inbox_index',
            );

            $table->index(
                [NotificationInterface::ATTR_TENANT_ID, NotificationInterface::ATTR_STATE],
                'notifications_tenant_state_index',
            );

            $table->index(
                NotificationInterface::ATTR_CATEGORY_SLUG,
                'notifications_category_slug_index',
            );

            $table->index(
                NotificationInterface::ATTR_ARCHIVED_AT,
                'notifications_archived_at_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(NotificationInterface::TABLE);
    }
};
