<?php

declare(strict_types=1);

use Academorix\Invitations\Contracts\Data\InvitationInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `invitations` table.
 *
 * One row per token-based invitation. Polymorphic `target_type`
 * + `target_id` — the concrete class is resolved by
 * `InvitationTargetRegistry` at hydrate time. Polymorphic
 * `inviter_type` + `inviter_id` — `user`, `service_account`, or
 * `system` (null id for `system`).
 *
 * `tenant_id` is nullable ONLY to accommodate platform-scope
 * invitations (Academorix staff onboarding). The
 * `BelongsToTenantOptional` scope keeps NULL tenant_id rows
 * out of tenant-host reads.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(InvitationInterface::TABLE, function (Blueprint $table): void {
            // Prefixed ULID `inv_<26 chars>`.
            $table->string(InvitationInterface::ATTR_ID, 64)->primary();

            // Tenancy axes.
            $table->uuid(InvitationInterface::ATTR_APPLICATION_ID)->nullable();
            $table->string(InvitationInterface::ATTR_TENANT_ID, 64)->nullable();

            // Polymorphic target.
            $table->string(InvitationInterface::ATTR_TARGET_TYPE, 64);
            $table->string(InvitationInterface::ATTR_TARGET_ID, 64);

            // Polymorphic inviter.
            $table->string(InvitationInterface::ATTR_INVITER_TYPE, 32)->default('system');
            $table->string(InvitationInterface::ATTR_INVITER_ID, 64)->nullable();

            // Invitee address + delivery.
            $table->string(InvitationInterface::ATTR_EMAIL, 254);
            $table->string(InvitationInterface::ATTR_CHANNEL, 16)->default('email');
            $table->string(InvitationInterface::ATTR_ROLE_KEY, 64)->nullable();
            $table->jsonb(InvitationInterface::ATTR_GRANTS)->nullable();
            $table->text(InvitationInterface::ATTR_MESSAGE)->nullable();

            // State machine.
            $table->string(InvitationInterface::ATTR_STATE, 16)->default('pending');

            // Token — hash + prefix; RAW token never persisted.
            $table->string(InvitationInterface::ATTR_TOKEN_HASH, 64)->unique();
            $table->string(InvitationInterface::ATTR_TOKEN_PREFIX, 16);

            // Expiry + resend cadence.
            $table->timestampTz(InvitationInterface::ATTR_EXPIRES_AT);
            $table->unsignedInteger(InvitationInterface::ATTR_RESEND_COUNT)->default(0);
            $table->timestampTz(InvitationInterface::ATTR_LAST_RESENT_AT)->nullable();

            // Funnel timestamps.
            $table->timestampTz(InvitationInterface::ATTR_SENT_AT)->nullable();
            $table->timestampTz(InvitationInterface::ATTR_DELIVERED_AT)->nullable();
            $table->timestampTz(InvitationInterface::ATTR_OPENED_AT)->nullable();
            $table->timestampTz(InvitationInterface::ATTR_CLICKED_AT)->nullable();

            // Terminal states.
            $table->timestampTz(InvitationInterface::ATTR_ACCEPTED_AT)->nullable();
            $table->uuid(InvitationInterface::ATTR_ACCEPTED_BY_USER_ID)->nullable();
            $table->timestampTz(InvitationInterface::ATTR_DECLINED_AT)->nullable();
            $table->string(InvitationInterface::ATTR_DECLINED_REASON, 200)->nullable();
            $table->timestampTz(InvitationInterface::ATTR_EXPIRED_AT)->nullable();
            $table->timestampTz(InvitationInterface::ATTR_REVOKED_AT)->nullable();
            $table->uuid(InvitationInterface::ATTR_REVOKED_BY_USER_ID)->nullable();
            $table->string(InvitationInterface::ATTR_REVOKED_REASON, 200)->nullable();

            // Bounce metadata.
            $table->string(InvitationInterface::ATTR_BOUNCE_KIND, 16)->nullable();
            $table->string(InvitationInterface::ATTR_BOUNCE_REASON, 200)->nullable();

            $table->jsonb(InvitationInterface::ATTR_METADATA)->nullable();

            // Audit + timestamps.
            $table->uuid(InvitationInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(InvitationInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(InvitationInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ──────────────────────────────────────────

            // Admin search + tenant read scope.
            $table->index(
                [InvitationInterface::ATTR_TENANT_ID, InvitationInterface::ATTR_STATE],
                'invitations_tenant_state_index',
            );

            // Polymorphic target lookup — reverse index on the target's
            // `invitations()` MorphMany relation.
            $table->index(
                [InvitationInterface::ATTR_TARGET_TYPE, InvitationInterface::ATTR_TARGET_ID],
                'invitations_target_index',
            );

            // Anti-harassment / duplicate-detection lookups.
            $table->index(
                [InvitationInterface::ATTR_EMAIL, InvitationInterface::ATTR_STATE],
                'invitations_email_state_index',
            );

            // Expiry sweeper hot path.
            $table->index(
                [InvitationInterface::ATTR_STATE, InvitationInterface::ATTR_EXPIRES_AT],
                'invitations_state_expires_at_index',
            );

            // Platform-admin search by visible token prefix.
            $table->index(
                InvitationInterface::ATTR_TOKEN_PREFIX,
                'invitations_token_prefix_index',
            );

            // Application axis — cross-tenant filter on platform-admin views.
            $table->index(
                InvitationInterface::ATTR_APPLICATION_ID,
                'invitations_application_id_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(InvitationInterface::TABLE);
    }
};
