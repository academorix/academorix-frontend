<?php

/**
 * @file modules/platform/settings/database/migrations/2026_07_15_000050_create_settings_groups_table.php
 *
 * @description
 * Create the `settings_groups` table — the top-level bundle catalogue
 * discovered from `#[AsSetting]` classes. `is_system = true` rows are
 * hydrated by the discovery pass and are immutable via HTTP.
 */

declare(strict_types=1);

use Academorix\Settings\Contracts\Data\SettingsGroupInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(SettingsGroupInterface::TABLE, function (Blueprint $table): void {
            $table->string(SettingsGroupInterface::ATTR_ID, 64)->primary();

            $table->string(SettingsGroupInterface::ATTR_KEY, 64)->unique();
            $table->string(SettingsGroupInterface::ATTR_NAME, 128);
            $table->text(SettingsGroupInterface::ATTR_DESCRIPTION)->nullable();
            $table->string(SettingsGroupInterface::ATTR_ICON, 64)->nullable();

            $table->integer(SettingsGroupInterface::ATTR_SORT_ORDER)->default(0);
            $table->boolean(SettingsGroupInterface::ATTR_IS_SYSTEM)->default(false);

            $table->jsonb(SettingsGroupInterface::ATTR_METADATA)->nullable();

            $table->uuid(SettingsGroupInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(SettingsGroupInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(SettingsGroupInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            $table->index(
                [SettingsGroupInterface::ATTR_IS_SYSTEM, SettingsGroupInterface::ATTR_SORT_ORDER],
                'settings_groups_system_sort_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(SettingsGroupInterface::TABLE);
    }
};
