<?php

/**
 * @file database/migrations/2025_11_01_000003_create_feature_rollouts_table.php
 *
 * @description
 * Per-tenant percentage-based enablement rows consumed by the
 * resolver's `RolloutLayer`. There is NO `scope_value` column — a
 * rollout targets a `scope_level` and the caller's concrete
 * `ScopeValue` is drawn at evaluation time and fed to
 * `RolloutHasher`. Unique on `(tenant_id, flag, scope_level)` —
 * at most one rollout per flag per level per tenant. The
 * `percentage` column carries a CHECK constraint of `0 <= x <= 100`.
 */

declare(strict_types=1);

use Stackra\FeatureFlags\Contracts\Data\FeatureRolloutInterface;
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
        Schema::create(FeatureRolloutInterface::TABLE, function (Blueprint $table): void {
            $table->char(FeatureRolloutInterface::ATTR_ID, 30)->primary();
            $table->char(FeatureRolloutInterface::ATTR_TENANT_ID, 30);
            $table->string(FeatureRolloutInterface::ATTR_FLAG, 191);
            $table->string(FeatureRolloutInterface::ATTR_SCOPE_LEVEL, 64);
            $table->unsignedTinyInteger(FeatureRolloutInterface::ATTR_PERCENTAGE);
            $table->text(FeatureRolloutInterface::ATTR_NOTES)->nullable();
            $table->timestamp(FeatureRolloutInterface::ATTR_STARTS_AT)->nullable();
            $table->timestamp(FeatureRolloutInterface::ATTR_ENDS_AT)->nullable();
            $table->char(FeatureRolloutInterface::ATTR_CREATED_BY, 30)->nullable();
            $table->char(FeatureRolloutInterface::ATTR_UPDATED_BY, 30)->nullable();
            $table->char(FeatureRolloutInterface::ATTR_DELETED_BY, 30)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(
                [
                    FeatureRolloutInterface::ATTR_TENANT_ID,
                    FeatureRolloutInterface::ATTR_FLAG,
                    FeatureRolloutInterface::ATTR_SCOPE_LEVEL,
                ],
                'feature_rollouts_scope_unique',
            );

            $table->index(
                [FeatureRolloutInterface::ATTR_FLAG, FeatureRolloutInterface::ATTR_SCOPE_LEVEL],
                'feature_rollouts_flag_index',
            );

            $table->index(FeatureRolloutInterface::ATTR_DELETED_AT, 'feature_rollouts_deleted_at_index');
            $table->index(FeatureRolloutInterface::ATTR_TENANT_ID, 'feature_rollouts_tenant_id_index');
        });

        // CHECK constraint for percentage bounds — the `unsignedTinyInteger`
        // caps at 255; the domain caps at 100. SQLite ignores CHECK
        // constraints defined this way but MySQL/Postgres honour them.
        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            Schema::getConnection()->statement(sprintf(
                'ALTER TABLE %s ADD CONSTRAINT feature_rollouts_percentage_check CHECK (%s BETWEEN 0 AND 100)',
                FeatureRolloutInterface::TABLE,
                FeatureRolloutInterface::ATTR_PERCENTAGE,
            ));
        }
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(FeatureRolloutInterface::TABLE);
    }
};
