<?php

/**
 * @file modules/platform/settings/database/migrations/2026_07_15_000051_create_settings_schemas_table.php
 *
 * @description
 * Create the `settings_schemas` table — one row per registered
 * `#[SettingField]`. FKs to `settings_groups` cascade on delete;
 * `is_system = true` rows are populated by the discovery pass.
 */

declare(strict_types=1);

use Academorix\Settings\Contracts\Data\SettingsGroupInterface;
use Academorix\Settings\Contracts\Data\SettingsSchemaInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(SettingsSchemaInterface::TABLE, function (Blueprint $table): void {
            $table->string(SettingsSchemaInterface::ATTR_ID, 64)->primary();

            $table->string(SettingsSchemaInterface::ATTR_GROUP_ID, 64);
            $table->foreign(SettingsSchemaInterface::ATTR_GROUP_ID)
                ->references(SettingsGroupInterface::ATTR_ID)
                ->on(SettingsGroupInterface::TABLE)
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(SettingsSchemaInterface::ATTR_KEY, 100);
            $table->string(SettingsSchemaInterface::ATTR_LABEL, 128);
            $table->text(SettingsSchemaInterface::ATTR_DESCRIPTION)->nullable();

            $table->string(SettingsSchemaInterface::ATTR_TYPE, 32)->default('string');
            $table->jsonb(SettingsSchemaInterface::ATTR_DEFAULT_VALUE)->nullable();
            $table->jsonb(SettingsSchemaInterface::ATTR_RULES)->nullable();

            $table->boolean(SettingsSchemaInterface::ATTR_SENSITIVE)->default(false);
            $table->boolean(SettingsSchemaInterface::ATTR_IS_SYSTEM)->default(false);
            $table->integer(SettingsSchemaInterface::ATTR_SORT_ORDER)->default(0);

            $table->jsonb(SettingsSchemaInterface::ATTR_METADATA)->nullable();

            $table->uuid(SettingsSchemaInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(SettingsSchemaInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(SettingsSchemaInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            $table->unique(
                [SettingsSchemaInterface::ATTR_GROUP_ID, SettingsSchemaInterface::ATTR_KEY],
                'settings_schemas_group_key_unique',
            );

            $table->index(
                [SettingsSchemaInterface::ATTR_GROUP_ID, SettingsSchemaInterface::ATTR_SORT_ORDER],
                'settings_schemas_group_sort_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(SettingsSchemaInterface::TABLE);
    }
};
