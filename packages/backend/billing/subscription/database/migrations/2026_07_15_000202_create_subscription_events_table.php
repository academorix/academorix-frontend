<?php

/**
 * @file modules/billing/subscription/database/migrations/2026_07_15_000202_create_subscription_events_table.php
 *
 * @description
 * Create the `subscription_events` table.
 *
 * Append-only audit rows for every state transition. `provider_event_id`
 * carries the Stripe / Paddle event id; the composite index on
 * `(subscription_id, occurred_at)` powers the tenant-facing feed.
 * NO SoftDeletes — 7-year retention is enforced by cold-archival, not
 * by soft-delete.
 */

declare(strict_types=1);

use Academorix\Subscription\Contracts\Data\SubscriptionEventInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::create(SubscriptionEventInterface::TABLE, function (Blueprint $table): void {
            $table->string(SubscriptionEventInterface::ATTR_ID, 64)->primary();

            $table->string(SubscriptionEventInterface::ATTR_TENANT_ID, 64);
            $table->string(SubscriptionEventInterface::ATTR_SUBSCRIPTION_ID, 64);

            $table->string(SubscriptionEventInterface::ATTR_KIND, 32);
            $table->string(SubscriptionEventInterface::ATTR_FROM_STATE, 24)->nullable();
            $table->string(SubscriptionEventInterface::ATTR_TO_STATE, 24)->nullable();
            $table->string(SubscriptionEventInterface::ATTR_FROM_PLAN_ID, 64)->nullable();
            $table->string(SubscriptionEventInterface::ATTR_TO_PLAN_ID, 64)->nullable();

            $table->bigInteger(SubscriptionEventInterface::ATTR_AMOUNT_MICRO_UNITS)->nullable();
            $table->string(SubscriptionEventInterface::ATTR_CURRENCY, 3)->nullable();

            $table->timestampTz(SubscriptionEventInterface::ATTR_OCCURRED_AT);
            $table->string(SubscriptionEventInterface::ATTR_ACTOR_TYPE, 24);
            $table->string(SubscriptionEventInterface::ATTR_ACTOR_ID, 64)->nullable();

            $table->string(SubscriptionEventInterface::ATTR_PROVIDER_EVENT_ID, 128)->nullable();
            $table->text(SubscriptionEventInterface::ATTR_REASON)->nullable();

            $table->jsonb(SubscriptionEventInterface::ATTR_PAYLOAD)->nullable();
            $table->jsonb(SubscriptionEventInterface::ATTR_METADATA)->nullable();

            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            $table->index(
                [
                    SubscriptionEventInterface::ATTR_SUBSCRIPTION_ID,
                    SubscriptionEventInterface::ATTR_OCCURRED_AT,
                ],
                'subscription_events_subscription_time_index',
            );

            $table->index(
                [
                    SubscriptionEventInterface::ATTR_TENANT_ID,
                    SubscriptionEventInterface::ATTR_KIND,
                    SubscriptionEventInterface::ATTR_OCCURRED_AT,
                ],
                'subscription_events_tenant_kind_index',
            );

            $table->index(
                [SubscriptionEventInterface::ATTR_PROVIDER_EVENT_ID],
                'subscription_events_provider_event_index',
            );
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(SubscriptionEventInterface::TABLE);
    }
};
