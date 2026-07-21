<?php

/**
 * @file modules/billing/subscription/database/migrations/2026_07_15_000200_create_plans_table.php
 *
 * @description
 * Create the `plans` table.
 *
 * Per-Application plan catalogue. `default_entitlements` seeds the
 * entitlements module when a tenant subscribes; `provider_price_id`
 * links to the Stripe / Paddle price at the provider side.
 *
 * A partial unique index on `(application_id, key)` filtered by
 * `deleted_at IS NULL` lets the observer soft-delete + re-create
 * plan rows without conflict.
 */

declare(strict_types=1);

use Stackra\Subscription\Contracts\Data\PlanInterface;
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
        Schema::create(PlanInterface::TABLE, function (Blueprint $table): void {
            $table->string(PlanInterface::ATTR_ID, 64)->primary();

            $table->string(PlanInterface::ATTR_APPLICATION_ID, 64);

            $table->string(PlanInterface::ATTR_KEY, 100);
            $table->string(PlanInterface::ATTR_NAME, 200);
            $table->text(PlanInterface::ATTR_DESCRIPTION)->nullable();

            $table->string(PlanInterface::ATTR_TIER, 24);
            $table->string(PlanInterface::ATTR_BILLING_CYCLE, 16);
            $table->string(PlanInterface::ATTR_BILLING_MODE, 16)->default('cashier');

            $table->bigInteger(PlanInterface::ATTR_PRICE_MICRO_UNITS)->default(0);
            $table->string(PlanInterface::ATTR_CURRENCY, 3)->default('USD');
            $table->string(PlanInterface::ATTR_PROVIDER_PRICE_ID, 128)->nullable();

            $table->integer(PlanInterface::ATTR_TRIAL_DAYS)->default(0);

            $table->jsonb(PlanInterface::ATTR_DEFAULT_ENTITLEMENTS)->default('{}');
            $table->jsonb(PlanInterface::ATTR_INCLUDED_FEATURES)->default('[]');

            $table->boolean(PlanInterface::ATTR_IS_SYSTEM)->default(false);
            $table->boolean(PlanInterface::ATTR_IS_PUBLIC)->default(true);
            $table->boolean(PlanInterface::ATTR_IS_DEPRECATED)->default(false);

            $table->integer(PlanInterface::ATTR_SORT_ORDER)->default(0);
            $table->timestampTz(PlanInterface::ATTR_ARCHIVED_AT)->nullable();

            $table->jsonb(PlanInterface::ATTR_METADATA)->nullable();

            $table->uuid(PlanInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(PlanInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(PlanInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            $table->index(
                [PlanInterface::ATTR_APPLICATION_ID, PlanInterface::ATTR_KEY],
                'plans_application_key_index',
            );

            $table->index(
                [PlanInterface::ATTR_APPLICATION_ID, PlanInterface::ATTR_TIER, PlanInterface::ATTR_IS_PUBLIC],
                'plans_public_catalogue_index',
            );

            $table->index(
                [PlanInterface::ATTR_PROVIDER_PRICE_ID],
                'plans_provider_price_index',
            );
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(PlanInterface::TABLE);
    }
};
