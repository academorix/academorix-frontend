<?php

/**
 * @file database/migrations/2025_11_01_000002_create_feature_overrides_table.php
 *
 * @description
 * Per-tenant, per-scope explicit allow/deny rows consumed by the
 * resolver's `OverrideLayer`. Unique on
 * `(tenant_id, flag, scope_level, scope_value)` — at most one
 * active override per subject per flag per tenant. The
 * `(flag, scope_level, scope_value)` lookup index accelerates the
 * resolver's read path; the `expires_at` index accelerates the
 * active-window filter.
 */

declare(strict_types=1);

use Stackra\FeatureFlags\Contracts\Data\FeatureOverrideInterface;
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
        Schema::create(FeatureOverrideInterface::TABLE, function (Blueprint $table): void {
            $table->char(FeatureOverrideInterface::ATTR_ID, 30)->primary();
            $table->char(FeatureOverrideInterface::ATTR_TENANT_ID, 30);
            $table->string(FeatureOverrideInterface::ATTR_FLAG, 191);
            $table->string(FeatureOverrideInterface::ATTR_SCOPE_LEVEL, 64);
            $table->string(FeatureOverrideInterface::ATTR_SCOPE_VALUE, 191);
            $table->string(FeatureOverrideInterface::ATTR_DECISION, 8);
            $table->text(FeatureOverrideInterface::ATTR_REASON)->nullable();
            $table->timestamp(FeatureOverrideInterface::ATTR_EXPIRES_AT)->nullable();
            $table->char(FeatureOverrideInterface::ATTR_CREATED_BY, 30)->nullable();
            $table->char(FeatureOverrideInterface::ATTR_UPDATED_BY, 30)->nullable();
            $table->char(FeatureOverrideInterface::ATTR_DELETED_BY, 30)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(
                [
                    FeatureOverrideInterface::ATTR_TENANT_ID,
                    FeatureOverrideInterface::ATTR_FLAG,
                    FeatureOverrideInterface::ATTR_SCOPE_LEVEL,
                    FeatureOverrideInterface::ATTR_SCOPE_VALUE,
                ],
                'feature_overrides_lookup_unique',
            );

            $table->index(
                [
                    FeatureOverrideInterface::ATTR_FLAG,
                    FeatureOverrideInterface::ATTR_SCOPE_LEVEL,
                    FeatureOverrideInterface::ATTR_SCOPE_VALUE,
                    FeatureOverrideInterface::ATTR_EXPIRES_AT,
                ],
                'feature_overrides_flag_lookup_index',
            );

            $table->index(FeatureOverrideInterface::ATTR_EXPIRES_AT, 'feature_overrides_expires_at_index');
            $table->index(FeatureOverrideInterface::ATTR_DELETED_AT, 'feature_overrides_deleted_at_index');
            $table->index(FeatureOverrideInterface::ATTR_TENANT_ID, 'feature_overrides_tenant_id_index');
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(FeatureOverrideInterface::TABLE);
    }
};
