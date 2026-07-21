<?php

declare(strict_types=1);

use Stackra\Branding\Contracts\Data\BrandingInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `brandings` table.
 *
 * Theme + palette per Tenant. Exactly one row per tenant is
 * `is_default = true` (partial unique) — denormalised into
 * `tenants.branding` by SyncBrandingJob.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(BrandingInterface::TABLE, function (Blueprint $table): void {
            $table->string(BrandingInterface::ATTR_ID, 64)->primary();

            $table->string(BrandingInterface::ATTR_TENANT_ID, 64);
            $table->foreign(BrandingInterface::ATTR_TENANT_ID)
                ->references('id')
                ->on('tenants')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(BrandingInterface::ATTR_DOMAIN_ID, 64)->nullable();
            $table->foreign(BrandingInterface::ATTR_DOMAIN_ID)
                ->references('id')
                ->on('domains')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->string(BrandingInterface::ATTR_NAME, 100);
            $table->boolean(BrandingInterface::ATTR_IS_DEFAULT)->default(false);

            $table->string(BrandingInterface::ATTR_THEME, 16)->default('auto');

            $table->string(BrandingInterface::ATTR_LOGO_URL, 2048)->nullable();
            $table->string(BrandingInterface::ATTR_LOGO_DARK_URL, 2048)->nullable();
            $table->string(BrandingInterface::ATTR_FAVICON_URL, 2048)->nullable();

            $table->string(BrandingInterface::ATTR_PRIMARY_COLOR, 7)->nullable();
            $table->string(BrandingInterface::ATTR_SECONDARY_COLOR, 7)->nullable();
            $table->string(BrandingInterface::ATTR_ACCENT_COLOR, 7)->nullable();
            $table->string(BrandingInterface::ATTR_BACKGROUND_COLOR, 7)->nullable();
            $table->string(BrandingInterface::ATTR_SURFACE_COLOR, 7)->nullable();
            $table->string(BrandingInterface::ATTR_TEXT_COLOR, 7)->nullable();

            $table->string(BrandingInterface::ATTR_FONT_STACK, 500)->nullable();
            $table->string(BrandingInterface::ATTR_CUSTOM_FONT_URL, 2048)->nullable();

            $table->jsonb(BrandingInterface::ATTR_CSS_VARIABLES)->nullable();
            $table->jsonb(BrandingInterface::ATTR_METADATA)->nullable();
            $table->jsonb(BrandingInterface::ATTR_TRANSLATIONS)->default('{}');

            $table->uuid(BrandingInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(BrandingInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(BrandingInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Exactly one default per tenant (partial unique — PG-specific).
            $table->index(
                [BrandingInterface::ATTR_TENANT_ID, BrandingInterface::ATTR_IS_DEFAULT],
                'brandings_tenant_default_index',
            );

            // One profile per (tenant, domain) pair.
            $table->index(
                [BrandingInterface::ATTR_TENANT_ID, BrandingInterface::ATTR_DOMAIN_ID],
                'brandings_tenant_domain_index',
            );

            $table->index(
                [BrandingInterface::ATTR_TENANT_ID, BrandingInterface::ATTR_CREATED_AT],
                'brandings_tenant_created_at_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(BrandingInterface::TABLE);
    }
};
