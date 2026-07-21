<?php

/**
 * @file modules/shared/transfer/database/migrations/2026_07_15_000111_create_xfer_shards_table.php
 *
 * @description
 * Create the `xfer_shards` table — one row per sub-job when a large
 * operation is sharded. Aggregated back into the parent
 * `xfer_jobs.counters` by `XferShardObserver::updated`.
 */

declare(strict_types=1);

use Stackra\Transfer\Contracts\Data\XferJobInterface;
use Stackra\Transfer\Contracts\Data\XferShardInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `xfer_shards` table.
 */
return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::create(XferShardInterface::TABLE, function (Blueprint $table): void {
            $table->string(XferShardInterface::ATTR_ID, 64)->primary();
            $table->string(XferShardInterface::ATTR_TENANT_ID, 64)->nullable()->index();
            $table->string(XferShardInterface::ATTR_XFER_JOB_ID, 64)->index();
            $table->unsignedInteger(XferShardInterface::ATTR_INDEX);
            $table->string(XferShardInterface::ATTR_SHEET_NAME, 128)->nullable();
            $table->unsignedBigInteger(XferShardInterface::ATTR_OFFSET)->default(0);
            $table->unsignedBigInteger(XferShardInterface::ATTR_LIMIT)->default(0);
            $table->string(XferShardInterface::ATTR_STATUS, 32)->index();
            $table->unsignedTinyInteger(XferShardInterface::ATTR_ATTEMPT)->default(0);
            $table->timestamp(XferShardInterface::ATTR_STARTED_AT)->nullable();
            $table->timestamp(XferShardInterface::ATTR_FINISHED_AT)->nullable();
            $table->string(XferShardInterface::ATTR_ERROR_CODE, 128)->nullable();
            $table->text(XferShardInterface::ATTR_ERROR_MESSAGE)->nullable();
            $table->json(XferShardInterface::ATTR_COUNTERS)->nullable();
            $table->timestamps();

            $table->foreign(XferShardInterface::ATTR_XFER_JOB_ID)
                ->references(XferJobInterface::ATTR_ID)
                ->on(XferJobInterface::TABLE)
                ->cascadeOnDelete();

            $table->unique([
                XferShardInterface::ATTR_XFER_JOB_ID,
                XferShardInterface::ATTR_INDEX,
            ], 'xfer_shards_job_index_uk');
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(XferShardInterface::TABLE);
    }
};
