<?php

declare(strict_types=1);

use Stackra\Tenancy\Contracts\Data\TenantContactInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `tenant_contacts` table.
 *
 * Named contact per Tenant per role. GDPR Art. 30 (ROPA) requires a
 * legally-distinct DPO contact; enterprise MSAs demand a separate
 * legal-notice address; billing collects invoices at yet another.
 * A partial unique index on `(tenant_id, kind)` where `is_primary`
 * enforces the "at most one primary per kind" invariant.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(TenantContactInterface::TABLE, function (Blueprint $table): void {
            // Primary key — prefixed ULID `wct_<26 chars>`.
            $table->string(TenantContactInterface::ATTR_ID, 64)->primary();

            // Tenant boundary — cascades on delete so contacts follow the tenant.
            $table->string(TenantContactInterface::ATTR_TENANT_ID, 64);
            $table->foreign(TenantContactInterface::ATTR_TENANT_ID)
                ->references('id')
                ->on('tenants')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            // Contact kind (billing / legal / dpo / …). String; enum-backed.
            $table->string(TenantContactInterface::ATTR_KIND, 16);

            // Contact details.
            $table->string(TenantContactInterface::ATTR_NAME, 200);
            $table->string(TenantContactInterface::ATTR_EMAIL, 320);
            $table->string(TenantContactInterface::ATTR_PHONE, 32)->nullable();
            $table->string(TenantContactInterface::ATTR_JOB_TITLE, 200)->nullable();
            $table->jsonb(TenantContactInterface::ATTR_ADDRESS)->nullable();
            $table->text(TenantContactInterface::ATTR_NOTES)->nullable();

            // Primary + verification flags.
            $table->boolean(TenantContactInterface::ATTR_IS_PRIMARY)->default(false);
            $table->timestampTz(TenantContactInterface::ATTR_VERIFIED_AT)->nullable();

            // Free-form metadata.
            $table->jsonb(TenantContactInterface::ATTR_METADATA)->nullable();

            // Userstamps.
            $table->uuid(TenantContactInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(TenantContactInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(TenantContactInterface::ATTR_DELETED_BY)->nullable();

            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            $table->index(
                [TenantContactInterface::ATTR_TENANT_ID, TenantContactInterface::ATTR_KIND],
                'tenant_contacts_tenant_kind_index',
            );
            $table->index(
                TenantContactInterface::ATTR_EMAIL,
                'tenant_contacts_email_index',
            );

            // Partial unique — exactly one primary per (tenant_id, kind).
            // Postgres supports partial indexes natively; other DBs enforce
            // via the observer's cascade-to-demote-siblings logic.
            $table->index(
                [TenantContactInterface::ATTR_TENANT_ID, TenantContactInterface::ATTR_KIND, TenantContactInterface::ATTR_IS_PRIMARY],
                'tenant_contacts_primary_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(TenantContactInterface::TABLE);
    }
};
