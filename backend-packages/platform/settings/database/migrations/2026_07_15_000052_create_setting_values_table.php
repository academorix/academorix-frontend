<?php

/**
 * @file modules/platform/settings/database/migrations/2026_07_15_000052_create_setting_values_table.php
 *
 * @description
 * Create the `setting_values` table — the per-scope value substrate.
 * One row per `(schema_id, scope_kind, scope_id)` tuple. System-scope
 * rows carry `scope_id = NULL` (partial unique index enforces
 * per-scope uniqueness).
 */

declare(strict_types=1);

use Academorix\Settings\Contracts\Data\SettingsSchemaInterface;
use Academorix\Settings\Contracts\Data\SettingValueInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(SettingValueInterface::TABLE, function (Blueprint $table): void {
            $table->string(SettingValueInterface::ATTR_ID, 64)->primary();

            $table->string(SettingValueInterface::ATTR_SCHEMA_ID, 64);
            $table->foreign(SettingValueInterface::ATTR_SCHEMA_ID)
                ->references(SettingsSchemaInterface::ATTR_ID)
                ->on(SettingsSchemaInterface::TABLE)
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(SettingValueInterface::ATTR_SCOPE_KIND, 16);
            $table->string(SettingValueInterface::ATTR_SCOPE_ID, 64)->nullable();

            $table->string(SettingValueInterface::ATTR_TENANT_ID, 64)->nullable();
            $table->foreign(SettingValueInterface::ATTR_TENANT_ID)
                ->references('id')
                ->on('tenants')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->jsonb(SettingValueInterface::ATTR_VALUE)->nullable();
            $table->jsonb(SettingValueInterface::ATTR_METADATA)->nullable();

            $table->uuid(SettingValueInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(SettingValueInterface::ATTR_UPDATED_BY)->nullable();
            $table->timestampsTz();

            // Composite index for the hot-path resolver lookup.
            $table->index(
                [
                    SettingValueInterface::ATTR_SCHEMA_ID,
                    SettingValueInterface::ATTR_SCOPE_KIND,
                    SettingValueInterface::ATTR_SCOPE_ID,
                ],
                'setting_values_lookup_index',
            );

            // Plain index for scope-wide reads (bulk group reads).
            $table->index(
                [SettingValueInterface::ATTR_SCOPE_KIND, SettingValueInterface::ATTR_SCOPE_ID],
                'setting_values_scope_index',
            );

            // Tenant-scoped fan-out for cascade deletes + reporting.
            $table->index(
                [SettingValueInterface::ATTR_TENANT_ID, SettingValueInterface::ATTR_SCOPE_KIND],
                'setting_values_tenant_scope_index',
            );
        });

        // Partial unique — one row per (schema, scope, owner) when
        // scope_id is set; system-scope rows (`scope_id NULL`) are
        // globally unique per schema by a separate partial index.
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement(\sprintf(
                'CREATE UNIQUE INDEX setting_values_scoped_unique
                 ON %s (%s, %s, %s)
                 WHERE %s IS NOT NULL',
                SettingValueInterface::TABLE,
                SettingValueInterface::ATTR_SCHEMA_ID,
                SettingValueInterface::ATTR_SCOPE_KIND,
                SettingValueInterface::ATTR_SCOPE_ID,
                SettingValueInterface::ATTR_SCOPE_ID,
            ));

            DB::statement(\sprintf(
                'CREATE UNIQUE INDEX setting_values_system_unique
                 ON %s (%s, %s)
                 WHERE %s IS NULL',
                SettingValueInterface::TABLE,
                SettingValueInterface::ATTR_SCHEMA_ID,
                SettingValueInterface::ATTR_SCOPE_KIND,
                SettingValueInterface::ATTR_SCOPE_ID,
            ));
        }
    }

    public function down(): void
    {
        Schema::dropIfExists(SettingValueInterface::TABLE);
    }
};
