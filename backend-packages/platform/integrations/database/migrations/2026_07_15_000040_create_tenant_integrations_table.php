<?php

declare(strict_types=1);

use Academorix\Integrations\Contracts\Data\TenantIntegrationInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `tenant_integrations` table.
 *
 * One row per (Tenant × integration kind × provider). Config blob is
 * encrypted at rest via the `IntegrationConfig` cast — the column
 * stores the encrypted envelope (not plaintext credentials).
 *
 * ## Indexes
 *
 *   - `tenant_integrations_active_index` — plain composite index on
 *     `(tenant_id, kind, is_active)`. The blueprint asks for a
 *     PARTIAL unique index (`WHERE is_active = TRUE AND deleted_at
 *     IS NULL`) which Laravel's cross-platform Blueprint DSL cannot
 *     emit portably — Postgres deployments should follow up with a
 *     raw `CREATE UNIQUE INDEX ... WHERE ...` migration once the
 *     table lands.
 *   - `tenant_integrations_tenant_kind_index` — fast tenant + kind
 *     lookup for repository finders.
 *   - `tenant_integrations_next_sync_at_index` — drives the periodic
 *     "due for sync" scan.
 */
return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::create(TenantIntegrationInterface::TABLE, function (Blueprint $table): void {
            $table->string(TenantIntegrationInterface::ATTR_ID, 64)->primary();

            $table->string(TenantIntegrationInterface::ATTR_TENANT_ID, 64);
            $table->foreign(TenantIntegrationInterface::ATTR_TENANT_ID)
                ->references('id')
                ->on('tenants')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(TenantIntegrationInterface::ATTR_KIND, 16);
            $table->string(TenantIntegrationInterface::ATTR_PROVIDER, 64);
            $table->string(TenantIntegrationInterface::ATTR_NAME, 200);

            // Encrypted-at-rest credential envelope. Never plaintext.
            $table->jsonb(TenantIntegrationInterface::ATTR_CONFIG);

            $table->boolean(TenantIntegrationInterface::ATTR_IS_ACTIVE)->default(false);

            $table->timestampTz(TenantIntegrationInterface::ATTR_LAST_SYNC_AT)->nullable();
            $table->string(TenantIntegrationInterface::ATTR_LAST_SYNC_STATUS, 16)->default('unknown');
            $table->text(TenantIntegrationInterface::ATTR_LAST_SYNC_ERROR)->nullable();

            $table->timestampTz(TenantIntegrationInterface::ATTR_NEXT_SYNC_AT)->nullable();

            $table->text(TenantIntegrationInterface::ATTR_SYNC_CURSOR)->nullable();

            $table->jsonb(TenantIntegrationInterface::ATTR_METADATA)->nullable();

            $table->uuid(TenantIntegrationInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(TenantIntegrationInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(TenantIntegrationInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // The blueprint asks for a partial unique on
            // `(tenant_id, kind, is_active) WHERE is_active = TRUE
            // AND deleted_at IS NULL`. Laravel's Blueprint DSL does
            // not expose partial-index predicates portably — a
            // Postgres-specific follow-up migration should emit the
            // real unique. This composite index is the best portable
            // approximation.
            $table->index(
                [
                    TenantIntegrationInterface::ATTR_TENANT_ID,
                    TenantIntegrationInterface::ATTR_KIND,
                    TenantIntegrationInterface::ATTR_IS_ACTIVE,
                ],
                'tenant_integrations_active_index',
            );

            $table->index(
                [
                    TenantIntegrationInterface::ATTR_TENANT_ID,
                    TenantIntegrationInterface::ATTR_KIND,
                ],
                'tenant_integrations_tenant_kind_index',
            );

            // Same partial-predicate note as above — the Postgres
            // follow-up should add `WHERE is_active = TRUE`.
            $table->index(
                [TenantIntegrationInterface::ATTR_NEXT_SYNC_AT],
                'tenant_integrations_next_sync_at_index',
            );
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(TenantIntegrationInterface::TABLE);
    }
};
