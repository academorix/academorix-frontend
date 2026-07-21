<?php

/**
 * @file modules/shared/localization/database/migrations/2026_08_01_000020_create_tenant_locales_table.php
 *
 * @description
 * Create the `tenant_locales` table — per-tenant enablement of a
 * platform language with default / fallback / auto-translate policy.
 */

declare(strict_types=1);

use Stackra\Localization\Contracts\Data\PlatformLanguageInterface;
use Stackra\Localization\Contracts\Data\TenantLocaleInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `tenant_locales` table.
 */
return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        $table = (string) \config(
            'localization.tables.tenant_locales',
            TenantLocaleInterface::TABLE,
        );

        $platformLanguagesTable = (string) \config(
            'localization.tables.platform_languages',
            PlatformLanguageInterface::TABLE,
        );

        Schema::create($table, function (Blueprint $blueprint) use ($platformLanguagesTable): void {
            $blueprint->string(TenantLocaleInterface::ATTR_ID, 64)->primary();

            $blueprint->string(TenantLocaleInterface::ATTR_TENANT_ID, 64)->index();

            // FK to platform_languages — restrict on delete so a
            // platform language can't be purged while tenants have
            // it enabled.
            $blueprint->string(TenantLocaleInterface::ATTR_LANGUAGE_ID, 64);
            $blueprint->foreign(TenantLocaleInterface::ATTR_LANGUAGE_ID, 'tenant_locales_lang_fk')
                ->references(PlatformLanguageInterface::ATTR_ID)
                ->on($platformLanguagesTable)
                ->restrictOnDelete();

            $blueprint->boolean(TenantLocaleInterface::ATTR_IS_DEFAULT)->default(false);
            $blueprint->boolean(TenantLocaleInterface::ATTR_IS_FALLBACK)->default(false);
            $blueprint->boolean(TenantLocaleInterface::ATTR_IS_ACTIVE)->default(true);

            // Nullable enum — when null, the driver resolution falls
            // through to `config('localization.default_driver')`.
            $blueprint->string(TenantLocaleInterface::ATTR_AUTO_TRANSLATE_DRIVER, 32)->nullable();

            // Optional quality-score threshold below which a
            // driver-produced translation is refused. Null = no floor.
            $blueprint->decimal(TenantLocaleInterface::ATTR_MIN_QUALITY_SCORE, total: 5, places: 4)->nullable();

            $blueprint->string(TenantLocaleInterface::ATTR_CREATED_BY, 64)->nullable();
            $blueprint->string(TenantLocaleInterface::ATTR_UPDATED_BY, 64)->nullable();
            $blueprint->string(TenantLocaleInterface::ATTR_DELETED_BY, 64)->nullable();
            $blueprint->softDeletes();
            $blueprint->timestamps();

            // Composite unique — a tenant cannot enable the same
            // platform language twice.
            $blueprint->unique(
                [TenantLocaleInterface::ATTR_TENANT_ID, TenantLocaleInterface::ATTR_LANGUAGE_ID],
                'tenant_locales_tenant_lang_unique',
            );

            $blueprint->index(
                [TenantLocaleInterface::ATTR_TENANT_ID, TenantLocaleInterface::ATTR_IS_ACTIVE],
                'tenant_locales_active_idx',
            );

            // Partial-unique index: at most one is_default=true per
            // tenant. Emulated via an index that scans; the observer
            // enforces the invariant on write.
            $blueprint->index(
                [TenantLocaleInterface::ATTR_TENANT_ID, TenantLocaleInterface::ATTR_IS_DEFAULT],
                'tenant_locales_default_idx',
            );

            // Same shape for is_fallback.
            $blueprint->index(
                [TenantLocaleInterface::ATTR_TENANT_ID, TenantLocaleInterface::ATTR_IS_FALLBACK],
                'tenant_locales_fallback_idx',
            );
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        $table = (string) \config(
            'localization.tables.tenant_locales',
            TenantLocaleInterface::TABLE,
        );

        Schema::dropIfExists($table);
    }
};
