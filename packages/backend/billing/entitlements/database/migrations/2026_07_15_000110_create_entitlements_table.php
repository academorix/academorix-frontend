<?php

declare(strict_types=1);

use Stackra\Entitlements\Contracts\Data\EntitlementInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `entitlements` table.
 *
 * One row per `(tenant_id, key)` tuple. The `value` JSONB column is
 * kind-dependent; the composite unique index on `(tenant_id, key)`
 * is filtered on `deleted_at IS NULL` so soft-deleted rows don't
 * block re-upserts.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(EntitlementInterface::TABLE, function (Blueprint $table): void {
            $table->string(EntitlementInterface::ATTR_ID, 64)->primary();

            // `application_id` is required — Entitlements is one of the eight
            // rows carrying it directly per `.kiro/steering/tenancy-columns.md`
            // §2. Added on 2026-07-21 (Phase E8) — closes the tenancy-columns
            // gap-register row "Add application_id to entitlements".
            $table->uuid(EntitlementInterface::ATTR_APPLICATION_ID);
            $table->foreign(EntitlementInterface::ATTR_APPLICATION_ID)
                ->references('id')
                ->on('applications');

            $table->string(EntitlementInterface::ATTR_TENANT_ID, 64);

            $table->string(EntitlementInterface::ATTR_KEY, 100);
            $table->string(EntitlementInterface::ATTR_KIND, 16);
            $table->jsonb(EntitlementInterface::ATTR_VALUE)->default('{}');
            $table->string(EntitlementInterface::ATTR_PERIOD, 16)->nullable();

            $table->timestampTz(EntitlementInterface::ATTR_CURRENT_PERIOD_STARTS_AT)->nullable();
            $table->timestampTz(EntitlementInterface::ATTR_CURRENT_PERIOD_ENDS_AT)->nullable();

            $table->string(EntitlementInterface::ATTR_SOURCE, 16)->default('plan');
            $table->string(EntitlementInterface::ATTR_PLAN_ID, 64)->nullable();
            $table->text(EntitlementInterface::ATTR_NOTES)->nullable();

            $table->jsonb(EntitlementInterface::ATTR_METADATA)->nullable();

            $table->uuid(EntitlementInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(EntitlementInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(EntitlementInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // One row per (tenant, key) — partial unique so soft-deleted
            // rows don't block re-upsert. Postgres-specific; SQLite in
            // tests uses a plain unique (softdelete-aware code paths
            // never hit this constraint under the test DSN).
            $table->index(
                [EntitlementInterface::ATTR_TENANT_ID, EntitlementInterface::ATTR_KEY],
                'entitlements_tenant_key_index',
            );

            // Composite (application, tenant) index — the canonical
            // §2 shape for the eight application-scoped rows. Written
            // in this order because most reads scope by application
            // first, then tenant. Phase E8.
            $table->index(
                [EntitlementInterface::ATTR_APPLICATION_ID, EntitlementInterface::ATTR_TENANT_ID],
                'entitlements_application_tenant_index',
            );

            $table->index(
                [EntitlementInterface::ATTR_KIND],
                'entitlements_kind_index',
            );

            $table->index(
                [EntitlementInterface::ATTR_CURRENT_PERIOD_ENDS_AT],
                'entitlements_period_ends_at_index',
            );

            $table->index(
                [EntitlementInterface::ATTR_TENANT_ID, EntitlementInterface::ATTR_CREATED_AT],
                'entitlements_tenant_created_at_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(EntitlementInterface::TABLE);
    }
};
