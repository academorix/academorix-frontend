<?php

declare(strict_types=1);

use Stackra\Entitlements\Contracts\Data\EntitlementInterface;
use Stackra\Entitlements\Contracts\Data\EntitlementUsageInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `entitlement_usages` table.
 *
 * Append-only per-consumption audit row. No soft deletes — retention
 * is handled by the retention job (`PruneUsageJob`). Cascading FK
 * back to `entitlements` so deleting a parent removes its history.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(EntitlementUsageInterface::TABLE, function (Blueprint $table): void {
            $table->string(EntitlementUsageInterface::ATTR_ID, 64)->primary();

            $table->string(EntitlementUsageInterface::ATTR_TENANT_ID, 64);

            $table->string(EntitlementUsageInterface::ATTR_ENTITLEMENT_ID, 64);
            $table->foreign(EntitlementUsageInterface::ATTR_ENTITLEMENT_ID)
                ->references(EntitlementInterface::ATTR_ID)
                ->on(EntitlementInterface::TABLE)
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(EntitlementUsageInterface::ATTR_KEY, 100);
            $table->integer(EntitlementUsageInterface::ATTR_DELTA)->default(0);
            $table->string(EntitlementUsageInterface::ATTR_REASON, 200);

            $table->string(EntitlementUsageInterface::ATTR_ACTOR_TYPE, 64)->nullable();
            $table->string(EntitlementUsageInterface::ATTR_ACTOR_ID, 64)->nullable();
            $table->string(EntitlementUsageInterface::ATTR_CORRELATION_ID, 64)->nullable();
            $table->string(EntitlementUsageInterface::ATTR_CURRENT_PERIOD_KEY, 32);

            $table->jsonb(EntitlementUsageInterface::ATTR_METADATA)->nullable();

            $table->uuid(EntitlementUsageInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(EntitlementUsageInterface::ATTR_UPDATED_BY)->nullable();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            $table->index(
                [
                    EntitlementUsageInterface::ATTR_ENTITLEMENT_ID,
                    EntitlementUsageInterface::ATTR_CURRENT_PERIOD_KEY,
                ],
                'entitlement_usages_entitlement_period_index',
            );

            $table->index(
                [
                    EntitlementUsageInterface::ATTR_TENANT_ID,
                    EntitlementUsageInterface::ATTR_KEY,
                    EntitlementUsageInterface::ATTR_CREATED_AT,
                ],
                'entitlement_usages_tenant_key_created_index',
            );

            $table->index(
                [EntitlementUsageInterface::ATTR_CORRELATION_ID],
                'entitlement_usages_correlation_id_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(EntitlementUsageInterface::TABLE);
    }
};
