<?php

/**
 * @file modules/shared/transfer/database/migrations/2026_07_15_000112_create_xfer_artifacts_table.php
 *
 * @description
 * Create the `xfer_artifacts` table — file output ledger. One row
 * per generated file (result / errors / source / template / workbook).
 * File CONTENTS inherit the source entity's data-classes tier;
 * this ledger row itself is public.
 */

declare(strict_types=1);

use Academorix\Transfer\Contracts\Data\XferArtifactInterface;
use Academorix\Transfer\Contracts\Data\XferJobInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `xfer_artifacts` table.
 */
return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::create(XferArtifactInterface::TABLE, function (Blueprint $table): void {
            $table->string(XferArtifactInterface::ATTR_ID, 64)->primary();
            $table->string(XferArtifactInterface::ATTR_TENANT_ID, 64)->nullable()->index();
            $table->string(XferArtifactInterface::ATTR_XFER_JOB_ID, 64)->nullable()->index();
            $table->string(XferArtifactInterface::ATTR_KIND, 32)->index();
            $table->string(XferArtifactInterface::ATTR_FORMAT, 16)->nullable();
            $table->string(XferArtifactInterface::ATTR_DISK, 64);
            $table->string(XferArtifactInterface::ATTR_PATH, 512)->nullable();
            $table->string(XferArtifactInterface::ATTR_FILENAME, 255);
            $table->string(XferArtifactInterface::ATTR_MIME_TYPE, 128)->nullable();
            $table->unsignedBigInteger(XferArtifactInterface::ATTR_SIZE_BYTES)->default(0);
            $table->unsignedBigInteger(XferArtifactInterface::ATTR_ROW_COUNT)->nullable();
            $table->string(XferArtifactInterface::ATTR_CHECKSUM_SHA256, 64)->nullable();
            $table->timestamp(XferArtifactInterface::ATTR_RETENTION_EXPIRES_AT)->nullable()->index();
            $table->timestamp(XferArtifactInterface::ATTR_PURGED_AT)->nullable();
            $table->string(XferArtifactInterface::ATTR_CREATED_BY_TYPE, 255)->nullable();
            $table->string(XferArtifactInterface::ATTR_CREATED_BY_ID, 64)->nullable();
            $table->timestamps();

            $table->foreign(XferArtifactInterface::ATTR_XFER_JOB_ID)
                ->references(XferJobInterface::ATTR_ID)
                ->on(XferJobInterface::TABLE)
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(XferArtifactInterface::TABLE);
    }
};
