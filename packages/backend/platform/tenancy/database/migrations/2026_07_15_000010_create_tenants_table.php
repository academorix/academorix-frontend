<?php

declare(strict_types=1);

use Stackra\Tenancy\Contracts\Data\TenantInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `tenants` table.
 *
 * Customer of an Stackra Application. Carries `application_id`
 * directly (one of the eight boundary rows per
 * `.kiro/steering/tenancy-columns.md` §2). Every domain row below
 * FKs into this table via `BelongsToTenant`.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(TenantInterface::TABLE, function (Blueprint $table): void {
            // Primary key — prefixed ULID `ten_<26 chars>`.
            $table->string(TenantInterface::ATTR_ID, 64)->primary();

            // Application boundary — direct FK.
            $table->string(TenantInterface::ATTR_APPLICATION_ID, 64);
            $table->foreign(TenantInterface::ATTR_APPLICATION_ID)
                ->references('id')
                ->on('applications')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            // URL-safe identifier — appears in `{slug}.{application.central_host}`.
            $table->string(TenantInterface::ATTR_SLUG, 63);

            // Display + legal name.
            $table->string(TenantInterface::ATTR_NAME, 200);
            $table->string(TenantInterface::ATTR_LEGAL_NAME, 200)->nullable();

            // Lifecycle status (backing value of TenantStatus enum).
            $table->string(TenantInterface::ATTR_STATUS, 16)->default('trialing');

            // BusinessType (references BusinessTypeEnum case values — string, code-primary).
            $table->string(TenantInterface::ATTR_BUSINESS_TYPE, 32)->nullable();

            // Locale + timezone + currency + country.
            $table->string(TenantInterface::ATTR_LOCALE, 10)->default('en');
            $table->string(TenantInterface::ATTR_TIMEZONE, 64)->default('UTC');
            $table->string(TenantInterface::ATTR_CURRENCY, 3)->default('USD');
            $table->string(TenantInterface::ATTR_COUNTRY_CODE, 2)->nullable();
            $table->string(TenantInterface::ATTR_TAX_ID, 64)->nullable();

            // Branding pointer + denormalised snapshot.
            $table->string(TenantInterface::ATTR_PRIMARY_BRANDING_ID, 64)->nullable();
            $table->jsonb(TenantInterface::ATTR_BRANDING)->nullable();

            // Settings + entitlements + terminology.
            $table->jsonb(TenantInterface::ATTR_SETTINGS)->nullable();
            $table->jsonb(TenantInterface::ATTR_FEATURES)->nullable();
            $table->jsonb(TenantInterface::ATTR_TERMINOLOGY)->nullable();

            // Lifecycle timestamps.
            $table->timestampTz(TenantInterface::ATTR_TRIAL_ENDS_AT)->nullable();
            $table->timestampTz(TenantInterface::ATTR_SUSPENDED_AT)->nullable();
            $table->string(TenantInterface::ATTR_SUSPENSION_REASON, 500)->nullable();
            $table->timestampTz(TenantInterface::ATTR_GRACE_ENDS_AT)->nullable();
            $table->timestampTz(TenantInterface::ATTR_ARCHIVED_AT)->nullable();

            // Free-form metadata + system flag.
            $table->jsonb(TenantInterface::ATTR_METADATA)->nullable();
            $table->boolean(TenantInterface::ATTR_IS_SYSTEM)->default(false);

            // Userstamps.
            $table->uuid(TenantInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(TenantInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(TenantInterface::ATTR_DELETED_BY)->nullable();

            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Unique per Application. Enforces "one tenant slug per app".
            $table->unique(
                [TenantInterface::ATTR_APPLICATION_ID, TenantInterface::ATTR_SLUG],
                'tenants_application_slug_unique',
            );

            $table->index(TenantInterface::ATTR_STATUS, 'tenants_status_index');
            $table->index(TenantInterface::ATTR_BUSINESS_TYPE, 'tenants_business_type_index');
            $table->index(TenantInterface::ATTR_COUNTRY_CODE, 'tenants_country_code_index');
            $table->index(
                [TenantInterface::ATTR_STATUS, TenantInterface::ATTR_ARCHIVED_AT],
                'tenants_status_archived_at_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(TenantInterface::TABLE);
    }
};
