<?php

declare(strict_types=1);

use Stackra\Notifications\Push\Contracts\Data\PushSubscriptionInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `push_subscriptions` table.
 *
 * One device-token registration per (user, application, device). `device_token`
 * is AES-256 encrypted at rest via the model's `encrypted` cast; only the
 * `device_token_fingerprint` (SHA-256) is admin-visible. Composite unique on
 * `(user_id, application_id, device_token_fingerprint)` gives us idempotent
 * re-registration when the same device submits the same token twice.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(PushSubscriptionInterface::TABLE, function (Blueprint $table): void {
            // Prefixed ULID `psub_<26 chars>`.
            $table->string(PushSubscriptionInterface::ATTR_ID, 64)->primary();

            $table->string(PushSubscriptionInterface::ATTR_TENANT_ID, 64);
            $table->foreign(PushSubscriptionInterface::ATTR_TENANT_ID)
                ->references('id')
                ->on('tenants')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(PushSubscriptionInterface::ATTR_APPLICATION_ID, 64);
            $table->foreign(PushSubscriptionInterface::ATTR_APPLICATION_ID)
                ->references('id')
                ->on('applications')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->uuid(PushSubscriptionInterface::ATTR_USER_ID);
            $table->foreign(PushSubscriptionInterface::ATTR_USER_ID)
                ->references('id')
                ->on('users')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            // Provider + platform metadata.
            $table->string(PushSubscriptionInterface::ATTR_PROVIDER, 32);
            $table->string(PushSubscriptionInterface::ATTR_PLATFORM, 16);

            // Encrypted at rest via the model's `encrypted` cast. Length
            // 2048 accommodates FCM tokens (~250 chars) + Web Push endpoints
            // (~500 chars) + envelope overhead from the encryption cast.
            $table->text(PushSubscriptionInterface::ATTR_DEVICE_TOKEN);

            // SHA-256 hex fingerprint of the plaintext token — non-secret,
            // used for admin listings + duplicate detection at register.
            $table->string(PushSubscriptionInterface::ATTR_DEVICE_TOKEN_FINGERPRINT, 64);

            // Device metadata for admin visibility.
            $table->string(PushSubscriptionInterface::ATTR_DEVICE_NAME, 200)->nullable();
            $table->string(PushSubscriptionInterface::ATTR_APP_VERSION, 32)->nullable();
            $table->string(PushSubscriptionInterface::ATTR_OS_VERSION, 32)->nullable();
            $table->string(PushSubscriptionInterface::ATTR_LOCALE, 16)->nullable();
            $table->string(PushSubscriptionInterface::ATTR_TIMEZONE, 64)->nullable();

            // Lifecycle state.
            $table->boolean(PushSubscriptionInterface::ATTR_IS_ACTIVE)->default(true);
            $table->timestampTz(PushSubscriptionInterface::ATTR_LAST_SEEN_AT)->nullable();
            $table->timestampTz(PushSubscriptionInterface::ATTR_EXPIRES_AT)->nullable();
            $table->timestampTz(PushSubscriptionInterface::ATTR_INVALID_TOKEN_REPORTED_AT)->nullable();

            $table->jsonb(PushSubscriptionInterface::ATTR_METADATA)->nullable();

            $table->uuid(PushSubscriptionInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(PushSubscriptionInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(PushSubscriptionInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Idempotent re-register lookup: one row per (user, app, token).
            $table->unique(
                [
                    PushSubscriptionInterface::ATTR_USER_ID,
                    PushSubscriptionInterface::ATTR_APPLICATION_ID,
                    PushSubscriptionInterface::ATTR_DEVICE_TOKEN_FINGERPRINT,
                ],
                'push_subscriptions_user_app_fingerprint_unique',
            );

            // Dispatch hot path: find every active subscription for a user
            // + application combo.
            $table->index(
                [
                    PushSubscriptionInterface::ATTR_USER_ID,
                    PushSubscriptionInterface::ATTR_APPLICATION_ID,
                    PushSubscriptionInterface::ATTR_IS_ACTIVE,
                ],
                'push_subscriptions_user_app_active_index',
            );

            // Tenant admin listing.
            $table->index(
                [PushSubscriptionInterface::ATTR_TENANT_ID, PushSubscriptionInterface::ATTR_CREATED_AT],
                'push_subscriptions_tenant_created_at_index',
            );

            // Idle-prune job scans by last_seen_at.
            $table->index(
                PushSubscriptionInterface::ATTR_LAST_SEEN_AT,
                'push_subscriptions_last_seen_at_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(PushSubscriptionInterface::TABLE);
    }
};
