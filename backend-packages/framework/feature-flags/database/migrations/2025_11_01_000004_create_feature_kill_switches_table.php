<?php

/**
 * @file database/migrations/2025_11_01_000004_create_feature_kill_switches_table.php
 *
 * @description
 * Platform-scoped emergency shut-off rows consumed by the
 * resolver's `KillSwitchLayer`. Deliberately has NO `tenant_id`
 * column — tenant targeting is encoded via
 * `(scope_level = 'tenant', scope_value = <tenant id>)`. A NULL
 * `scope_value` means "every value at this level"; the unique
 * key treats NULL as its own value (Requirement 9.7).
 */

declare(strict_types=1);

use Academorix\FeatureFlags\Contracts\Data\FeatureKillSwitchInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::create(FeatureKillSwitchInterface::TABLE, function (Blueprint $table): void {
            $table->char(FeatureKillSwitchInterface::ATTR_ID, 30)->primary();
            $table->string(FeatureKillSwitchInterface::ATTR_FLAG, 191);
            $table->string(FeatureKillSwitchInterface::ATTR_SCOPE_LEVEL, 64);
            $table->string(FeatureKillSwitchInterface::ATTR_SCOPE_VALUE, 191)->nullable();
            $table->text(FeatureKillSwitchInterface::ATTR_REASON)->nullable();
            $table->timestamp(FeatureKillSwitchInterface::ATTR_ENABLED_AT);
            $table->timestamp(FeatureKillSwitchInterface::ATTR_DISABLED_AT)->nullable();
            $table->char(FeatureKillSwitchInterface::ATTR_CREATED_BY, 30)->nullable();
            $table->char(FeatureKillSwitchInterface::ATTR_UPDATED_BY, 30)->nullable();
            $table->char(FeatureKillSwitchInterface::ATTR_DELETED_BY, 30)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(
                [
                    FeatureKillSwitchInterface::ATTR_FLAG,
                    FeatureKillSwitchInterface::ATTR_SCOPE_LEVEL,
                    FeatureKillSwitchInterface::ATTR_SCOPE_VALUE,
                ],
                'feature_kill_switches_lookup_unique',
            );

            $table->index(
                [
                    FeatureKillSwitchInterface::ATTR_FLAG,
                    FeatureKillSwitchInterface::ATTR_SCOPE_LEVEL,
                    FeatureKillSwitchInterface::ATTR_ENABLED_AT,
                    FeatureKillSwitchInterface::ATTR_DISABLED_AT,
                ],
                'feature_kill_switches_flag_window_index',
            );

            $table->index(FeatureKillSwitchInterface::ATTR_DELETED_AT, 'feature_kill_switches_deleted_at_index');
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(FeatureKillSwitchInterface::TABLE);
    }
};
