<?php

declare(strict_types=1);

use Academorix\Invitations\Contracts\Data\InvitationEventInterface;
use Academorix\Invitations\Contracts\Data\InvitationInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `invitation_events` table.
 *
 * Append-only audit-funnel log — one row per state transition or
 * transport signal (`sent`, `delivered`, `opened`, `clicked`,
 * `accepted`, `declined`, `expired`, `revoked`, `bounced`,
 * `resent`, `preflight_failed`). `(signal_id, transport)` is unique
 * for mail-transport webhook idempotency.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(InvitationEventInterface::TABLE, function (Blueprint $table): void {
            // Prefixed ULID `ive_<26 chars>`.
            $table->string(InvitationEventInterface::ATTR_ID, 64)->primary();

            $table->string(InvitationEventInterface::ATTR_INVITATION_ID, 64);
            $table->foreign(InvitationEventInterface::ATTR_INVITATION_ID)
                ->references(InvitationInterface::ATTR_ID)
                ->on(InvitationInterface::TABLE)
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->uuid(InvitationEventInterface::ATTR_APPLICATION_ID)->nullable();
            $table->string(InvitationEventInterface::ATTR_TENANT_ID, 64)->nullable();

            $table->string(InvitationEventInterface::ATTR_EVENT, 32);
            $table->timestampTz(InvitationEventInterface::ATTR_OCCURRED_AT);

            // Polymorphic actor.
            $table->string(InvitationEventInterface::ATTR_ACTOR_TYPE, 32)->nullable();
            $table->string(InvitationEventInterface::ATTR_ACTOR_ID, 64)->nullable();

            // Transport signals.
            $table->string(InvitationEventInterface::ATTR_TRANSPORT, 32)->nullable();
            $table->string(InvitationEventInterface::ATTR_SIGNAL_ID, 191)->nullable();

            // Request metadata.
            $table->string(InvitationEventInterface::ATTR_IP_ADDRESS, 45)->nullable();
            $table->string(InvitationEventInterface::ATTR_USER_AGENT, 500)->nullable();
            $table->string(InvitationEventInterface::ATTR_COUNTRY_CODE, 2)->nullable();
            $table->string(InvitationEventInterface::ATTR_CITY, 100)->nullable();

            // Error envelope for `preflight_failed` + `bounced` rows.
            $table->string(InvitationEventInterface::ATTR_ERROR_CODE, 64)->nullable();
            $table->string(InvitationEventInterface::ATTR_ERROR_MESSAGE, 500)->nullable();

            $table->jsonb(InvitationEventInterface::ATTR_METADATA)->nullable();

            $table->timestampTz(InvitationEventInterface::ATTR_CREATED_AT)->useCurrent();

            // ── Indexes ──────────────────────────────────────────

            // Timeline read — events for an invitation ordered by
            // `occurred_at` DESC.
            $table->index(
                [InvitationEventInterface::ATTR_INVITATION_ID, InvitationEventInterface::ATTR_OCCURRED_AT],
                'invitation_events_invitation_occurred_at_index',
            );

            // Funnel roll-ups by event kind.
            $table->index(
                [InvitationEventInterface::ATTR_EVENT, InvitationEventInterface::ATTR_OCCURRED_AT],
                'invitation_events_event_occurred_at_index',
            );

            // Idempotency guard — same signal from the same transport
            // must be a no-op on retry.
            $table->unique(
                [InvitationEventInterface::ATTR_TRANSPORT, InvitationEventInterface::ATTR_SIGNAL_ID],
                'invitation_events_transport_signal_unique',
            );

            $table->index(
                [InvitationEventInterface::ATTR_TENANT_ID, InvitationEventInterface::ATTR_EVENT],
                'invitation_events_tenant_event_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(InvitationEventInterface::TABLE);
    }
};
