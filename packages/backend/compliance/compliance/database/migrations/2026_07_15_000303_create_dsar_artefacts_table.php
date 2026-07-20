<?php

/**
 * @file modules/compliance/compliance/database/migrations/2026_07_15_000303_create_dsar_artefacts_table.php
 *
 * @description
 * Create the `dsar_artefacts` table.
 */

declare(strict_types=1);

use Academorix\Compliance\Contracts\Data\DsarArtefactInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(DsarArtefactInterface::TABLE, function (Blueprint $table): void {
            $table->string(DsarArtefactInterface::ATTR_ID, 64)->primary();

            $table->string(DsarArtefactInterface::ATTR_TENANT_ID, 64);
            $table->string(DsarArtefactInterface::ATTR_DSAR_ID, 64);

            $table->string(DsarArtefactInterface::ATTR_MODULE, 64);
            $table->string(DsarArtefactInterface::ATTR_ENTITY, 128);
            $table->integer(DsarArtefactInterface::ATTR_ROW_COUNT)->default(0);
            $table->string(DsarArtefactInterface::ATTR_FORMAT, 16)->default('json');
            $table->string(DsarArtefactInterface::ATTR_FILE_ID, 64)->nullable();
            $table->jsonb(DsarArtefactInterface::ATTR_REDACTED_COLUMNS)->nullable();
            $table->string(DsarArtefactInterface::ATTR_STATUS, 24)->default('pending');
            $table->text(DsarArtefactInterface::ATTR_ERROR)->nullable();

            $table->jsonb(DsarArtefactInterface::ATTR_METADATA)->nullable();

            $table->uuid(DsarArtefactInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(DsarArtefactInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(DsarArtefactInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            $table->index(
                [DsarArtefactInterface::ATTR_DSAR_ID, DsarArtefactInterface::ATTR_MODULE],
                'dsar_artefacts_dsar_module_index',
            );

            $table->index(
                [DsarArtefactInterface::ATTR_TENANT_ID],
                'dsar_artefacts_tenant_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(DsarArtefactInterface::TABLE);
    }
};
