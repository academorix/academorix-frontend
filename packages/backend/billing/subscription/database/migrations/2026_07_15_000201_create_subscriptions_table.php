<?php

/**
 * @file modules/billing/subscription/database/migrations/2026_07_15_000201_create_subscriptions_table.php
 *
 * @description
 * Create the `subscriptions` table.
 *
 * Tenant's active subscription. `provider_subscription_id` links to
 * Cashier's own subscription row at Stripe / Paddle;
 * `provider_customer_id` is denormalised from `tenants` for query
 * speed. The `grace_ends_at` column is what makes our lifecycle
 * different from Cashier's — grace extends beyond the provider
 * default.
 */

declare(strict_types=1);

use Stackra\Subscription\Contracts\Data\SubscriptionInterface;
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
        Schema::create(SubscriptionInterface::TABLE, function (Blueprint $table): void {
            $table->string(SubscriptionInterface::ATTR_ID, 64)->primary();

            $table->string(SubscriptionInterface::ATTR_TENANT_ID, 64);
            $table->string(SubscriptionInterface::ATTR_APPLICATION_ID, 64);
            $table->string(SubscriptionInterface::ATTR_PLAN_ID, 64);

            $table->string(SubscriptionInterface::ATTR_PROVIDER, 24);
            $table->string(SubscriptionInterface::ATTR_PROVIDER_SUBSCRIPTION_ID, 128)->nullable();
            $table->string(SubscriptionInterface::ATTR_PROVIDER_CUSTOMER_ID, 128)->nullable();

            $table->string(SubscriptionInterface::ATTR_STATE, 24)->default('trialing');
            $table->string(SubscriptionInterface::ATTR_BILLING_CYCLE, 16);

            $table->timestampTz(SubscriptionInterface::ATTR_TRIAL_ENDS_AT)->nullable();
            $table->timestampTz(SubscriptionInterface::ATTR_CURRENT_PERIOD_START)->nullable();
            $table->timestampTz(SubscriptionInterface::ATTR_CURRENT_PERIOD_END)->nullable();
            $table->timestampTz(SubscriptionInterface::ATTR_GRACE_ENDS_AT)->nullable();
            $table->timestampTz(SubscriptionInterface::ATTR_SUSPENDED_AT)->nullable();
            $table->timestampTz(SubscriptionInterface::ATTR_CANCELLED_AT)->nullable();
            $table->boolean(SubscriptionInterface::ATTR_CANCEL_AT_PERIOD_END)->default(false);
            $table->timestampTz(SubscriptionInterface::ATTR_REINSTATED_AT)->nullable();
            $table->timestampTz(SubscriptionInterface::ATTR_LAST_PAYMENT_AT)->nullable();
            $table->timestampTz(SubscriptionInterface::ATTR_LAST_PAYMENT_FAILED_AT)->nullable();
            $table->integer(SubscriptionInterface::ATTR_CONSECUTIVE_FAILURES)->default(0);

            $table->jsonb(SubscriptionInterface::ATTR_METADATA)->nullable();

            $table->uuid(SubscriptionInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(SubscriptionInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(SubscriptionInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            $table->index(
                [SubscriptionInterface::ATTR_TENANT_ID, SubscriptionInterface::ATTR_STATE],
                'subscriptions_tenant_state_index',
            );

            $table->index(
                [SubscriptionInterface::ATTR_APPLICATION_ID, SubscriptionInterface::ATTR_STATE],
                'subscriptions_app_state_index',
            );

            $table->index(
                [SubscriptionInterface::ATTR_PROVIDER_SUBSCRIPTION_ID],
                'subscriptions_provider_index',
            );

            $table->index(
                [SubscriptionInterface::ATTR_GRACE_ENDS_AT],
                'subscriptions_grace_scan_index',
            );

            $table->index(
                [SubscriptionInterface::ATTR_TRIAL_ENDS_AT],
                'subscriptions_trial_scan_index',
            );
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(SubscriptionInterface::TABLE);
    }
};
