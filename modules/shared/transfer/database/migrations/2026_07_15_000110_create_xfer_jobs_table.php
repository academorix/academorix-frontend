<?php

/**
 * @file modules/shared/transfer/database/migrations/2026_07_15_000110_create_xfer_jobs_table.php
 *
 * @description
 * Create the `xfer_jobs` table — the operation record for every
 * import / export / sample the transfer engine runs. The row
 * persists independently of the queue job lifetime.
 */

declare(strict_types=1);

use Academorix\Transfer\Contracts\Data\XferJobInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `xfer_jobs` table.
 */
return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::create(XferJobInterface::TABLE, function (Blueprint $table): void {
            $table->string(XferJobInterface::ATTR_ID, 64)->primary();
            $table->string(XferJobInterface::ATTR_TENANT_ID, 64)->nullable()->index();
            $table->string(XferJobInterface::ATTR_KIND, 32)->index();
            $table->string(XferJobInterface::ATTR_ENTITY_KEY, 128)->index();
            $table->string(XferJobInterface::ATTR_FORMAT, 16)->nullable();
            $table->string(XferJobInterface::ATTR_MODE, 16)->nullable();
            $table->string(XferJobInterface::ATTR_STATUS, 32)->index();
            $table->string(XferJobInterface::ATTR_INITIATOR_USER_ID, 64)->nullable()->index();
            $table->string(XferJobInterface::ATTR_SOURCE_PATH, 512)->nullable();
            $table->unsignedBigInteger(XferJobInterface::ATTR_SOURCE_SIZE_BYTES)->nullable();
            $table->unsignedBigInteger(XferJobInterface::ATTR_SOURCE_ROW_COUNT)->nullable();
            $table->json(XferJobInterface::ATTR_NOTIFY_CHANNELS)->nullable();
            $table->string(XferJobInterface::ATTR_MAPPING_PROFILE_ID, 64)->nullable();
            $table->json(XferJobInterface::ATTR_FILTERS)->nullable();
            $table->json(XferJobInterface::ATTR_INCLUDE_RELATIONS)->nullable();
            $table->json(XferJobInterface::ATTR_COLUMNS)->nullable();
            $table->string(XferJobInterface::ATTR_ERROR_ARTIFACT_ID, 64)->nullable();
            $table->string(XferJobInterface::ATTR_RESULT_ARTIFACT_ID, 64)->nullable();
            $table->json(XferJobInterface::ATTR_COUNTERS)->nullable();
            $table->timestamp(XferJobInterface::ATTR_STARTED_AT)->nullable();
            $table->timestamp(XferJobInterface::ATTR_COMPLETED_AT)->nullable();
            $table->text(XferJobInterface::ATTR_FAILED_REASON)->nullable();
            $table->json(XferJobInterface::ATTR_METADATA)->nullable();
            $table->string(XferJobInterface::ATTR_CREATED_BY, 64)->nullable();
            $table->string(XferJobInterface::ATTR_UPDATED_BY, 64)->nullable();
            $table->string(XferJobInterface::ATTR_DELETED_BY, 64)->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index([
                XferJobInterface::ATTR_TENANT_ID,
                XferJobInterface::ATTR_STATUS,
                XferJobInterface::ATTR_CREATED_AT,
            ], 'xfer_jobs_tenant_status_time_idx');
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(XferJobInterface::TABLE);
    }
};
