<?php

/**
 * @file database/migrations/2026_07_15_120000_create_theme_presets_table.php
 *
 * @description
 * Create the `theme_presets` table for the dual-source preset catalogue.
 * `is_system = true` rows are seeded from
 * {@see \Academorix\Theme\Enums\ThemePresetSlug} and are IMMUTABLE outside
 * the seeder. Tenant customs carry `is_system = false` and a non-null
 * `tenant_id`.
 */

declare(strict_types=1);

use Academorix\Theme\Contracts\Data\ThemePresetInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::create(ThemePresetInterface::TABLE, function (Blueprint $table): void {
            $table->string(ThemePresetInterface::ATTR_ID, 64)->primary();
            $table->string(ThemePresetInterface::ATTR_TENANT_ID, 64)->nullable();
            $table->foreign(ThemePresetInterface::ATTR_TENANT_ID)
                ->references('id')->on('tenants')->onDelete('cascade');

            $table->string(ThemePresetInterface::ATTR_SLUG, 64);
            $table->string(ThemePresetInterface::ATTR_NAME, 128);
            $table->text(ThemePresetInterface::ATTR_DESCRIPTION)->nullable();
            $table->string(ThemePresetInterface::ATTR_MODE, 16);
            $table->string(ThemePresetInterface::ATTR_CATEGORY, 32)->default('tenant_custom');
            $table->jsonb(ThemePresetInterface::ATTR_TOKENS);
            $table->string(ThemePresetInterface::ATTR_PREVIEW_THUMBNAIL_URL, 512)->nullable();
            $table->boolean(ThemePresetInterface::ATTR_IS_ACTIVE)->default(true);
            $table->boolean(ThemePresetInterface::ATTR_IS_SYSTEM)->default(false);

            $table->string(ThemePresetInterface::ATTR_CREATED_BY_USER_ID, 64)->nullable();
            $table->foreign(ThemePresetInterface::ATTR_CREATED_BY_USER_ID)
                ->references('id')->on('users')->onDelete('restrict');

            $table->jsonb(ThemePresetInterface::ATTR_METADATA)->nullable();

            $table->uuid(ThemePresetInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(ThemePresetInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(ThemePresetInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(
                [ThemePresetInterface::ATTR_TENANT_ID, ThemePresetInterface::ATTR_MODE, ThemePresetInterface::ATTR_CATEGORY],
                'theme_presets_tenant_mode_category_index',
            );
            $table->index(
                [ThemePresetInterface::ATTR_TENANT_ID, ThemePresetInterface::ATTR_IS_ACTIVE],
                'theme_presets_tenant_active_index',
            );
            $table->index(
                [ThemePresetInterface::ATTR_IS_SYSTEM, ThemePresetInterface::ATTR_SLUG],
                'theme_presets_system_slug_index',
            );
        });

        // Functional unique index (Postgres-specific) — a tenant cannot
        // hold two live custom presets on the same slug, and the
        // platform catalogue cannot hold two system rows on the same
        // slug. NULL tenant_id collapses to the sentinel string
        // 'platform' so the platform catalogue participates in the
        // unique constraint.
        DB::statement(sprintf(
            'CREATE UNIQUE INDEX theme_presets_slug_unique_alive_idx ON %s (COALESCE(%s, \'platform\'), %s) WHERE %s IS NULL',
            ThemePresetInterface::TABLE,
            ThemePresetInterface::ATTR_TENANT_ID,
            ThemePresetInterface::ATTR_SLUG,
            ThemePresetInterface::ATTR_DELETED_AT,
        ));
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(ThemePresetInterface::TABLE);
    }
};
