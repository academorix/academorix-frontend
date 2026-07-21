<?php

/**
 * @file modules/shared/transfer/database/migrations/2026_07_15_000113_create_xfer_mapping_profiles_table.php
 *
 * @description
 * Create the `xfer_mapping_profiles` table — saved header-remap
 * profile per tenant per entity. Reusable across imports.
 */

declare(strict_types=1);

use Stackra\Transfer\Contracts\Data\XferMappingProfileInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `xfer_mapping_profiles` table.
 */
return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::create(XferMappingProfileInterface::TABLE, function (Blueprint $table): void {
            $table->string(XferMappingProfileInterface::ATTR_ID, 64)->primary();
            $table->string(XferMappingProfileInterface::ATTR_TENANT_ID, 64)->nullable()->index();
            $table->string(XferMappingProfileInterface::ATTR_OWNER_ID, 64)->nullable()->index();
            $table->string(XferMappingProfileInterface::ATTR_ENTITY_KEY, 128)->index();
            $table->string(XferMappingProfileInterface::ATTR_NAME, 191);
            $table->text(XferMappingProfileInterface::ATTR_DESCRIPTION)->nullable();
            $table->json(XferMappingProfileInterface::ATTR_HEADER_MAP);
            $table->unsignedSmallInteger(XferMappingProfileInterface::ATTR_START_ROW)->default(2);
            $table->unsignedSmallInteger(XferMappingProfileInterface::ATTR_HEADING_ROW)->default(1);
            $table->json(XferMappingProfileInterface::ATTR_CSV_SETTINGS)->nullable();
            $table->boolean(XferMappingProfileInterface::ATTR_IS_DEFAULT)->default(false);
            $table->boolean(XferMappingProfileInterface::ATTR_IS_SHARED)->default(false);
            $table->unsignedBigInteger(XferMappingProfileInterface::ATTR_USED_COUNT)->default(0);
            $table->timestamp(XferMappingProfileInterface::ATTR_LAST_USED_AT)->nullable();
            $table->string(XferMappingProfileInterface::ATTR_CREATED_BY, 64)->nullable();
            $table->string(XferMappingProfileInterface::ATTR_UPDATED_BY, 64)->nullable();
            $table->string(XferMappingProfileInterface::ATTR_DELETED_BY, 64)->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->unique([
                XferMappingProfileInterface::ATTR_TENANT_ID,
                XferMappingProfileInterface::ATTR_OWNER_ID,
                XferMappingProfileInterface::ATTR_ENTITY_KEY,
                XferMappingProfileInterface::ATTR_NAME,
            ], 'xfer_mapping_profiles_owner_name_uk');
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(XferMappingProfileInterface::TABLE);
    }
};
