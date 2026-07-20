<?php

/**
 * @file modules/compliance/compliance/database/migrations/2026_07_15_000305_create_retention_runs_table.php
 *
 * @description
 * Create the `retention_runs` table.
 */

declare(strict_types=1);

use Academorix\Compliance\Contracts\Data\RetentionRunInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(RetentionRunInterface::TABLE, function (Blueprint $table): void {
            $table->string(RetentionRunInterface::ATTR_ID, 64)->primary();

            $table->string(RetentionRunInterface::ATTR_TENANT_ID, 64)->nullable();

            $table->timestampTz(RetentionRunInterface::ATTR_STARTED_AT);
            $table->timestampTz(RetentionRunInterface::ATTR_FINISHED_AT)->nullable();
            $table->string(RetentionRunInterface::ATTR_STATUS, 24)->default('running');
            $table->string(RetentionRunInterface::ATTR_TRIGGER, 24)->default('nightly');
            $table->string(RetentionRunInterface::ATTR_TRIGGERED_BY, 64)->nullable();

            $table->integer(RetentionRunInterface::ATTR_PURGED_COUNT)->default(0);
            $table->integer(RetentionRunInterface::ATTR_ANONYMIZED_COUNT)->default(0);
            $table->integer(RetentionRunInterface::ATTR_ARCHIVED_COUNT)->default(0);
            $table->integer(RetentionRunInterface::ATTR_HELD_COUNT)->default(0);
            $table->integer(RetentionRunInterface::ATTR_SKIPPED_COUNT)->default(0);
            $table->integer(RetentionRunInterface::ATTR_FAILED_COUNT)->default(0);

            $table->jsonb(RetentionRunInterface::ATTR_SUMMARY)->nullable();
            $table->jsonb(RetentionRunInterface::ATTR_METADATA)->nullable();

            $table->timestampsTz();

            $table->index(
                [RetentionRunInterface::ATTR_TENANT_ID, RetentionRunInterface::ATTR_STARTED_AT],
                'retention_runs_tenant_time_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(RetentionRunInterface::TABLE);
    }
};
