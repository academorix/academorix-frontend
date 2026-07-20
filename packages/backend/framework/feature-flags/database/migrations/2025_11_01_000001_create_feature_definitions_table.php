<?php

/**
 * @file database/migrations/2025_11_01_000001_create_feature_definitions_table.php
 *
 * @description
 * Create the `feature_definitions` catalog table — the platform-
 * scoped registry of every flag known to the package. Populated
 * exclusively by `FeatureFlagDiscovery` on `package:discover`;
 * read by the resolver's `DefaultLayer`, the checker's cache-TTL
 * fallback, and the admin `ListFlags` / `ShowFlag` endpoints. The
 * table is deliberately named `feature_definitions` — not
 * `features` — to avoid colliding with Pennant's own
 * `DatabaseDriver` schema.
 */

declare(strict_types=1);

use Academorix\FeatureFlags\Contracts\Data\FeatureInterface;
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
        Schema::create(FeatureInterface::TABLE, function (Blueprint $table): void {
            $table->char(FeatureInterface::ATTR_ID, 30)->primary();
            $table->string(FeatureInterface::ATTR_NAME, 191);
            $table->text(FeatureInterface::ATTR_DESCRIPTION)->nullable();
            $table->string(FeatureInterface::ATTR_KIND, 32);
            $table->boolean(FeatureInterface::ATTR_DEFAULT_OFF)->default(true);
            $table->unsignedInteger(FeatureInterface::ATTR_CACHE_TTL)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(FeatureInterface::ATTR_NAME, 'feature_definitions_name_unique');
            $table->index(FeatureInterface::ATTR_KIND, 'feature_definitions_kind_index');
            $table->index(FeatureInterface::ATTR_DELETED_AT, 'feature_definitions_deleted_at_index');
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(FeatureInterface::TABLE);
    }
};
