<?php

/**
 * @file modules/platform/storage/database/migrations/2026_07_15_000061_create_file_variants_table.php
 *
 * @description
 * Create the `file_variants` table — derived renditions of a File.
 * One row per (file_id, variant_key). Cascades on parent hard-delete.
 */

declare(strict_types=1);

use Stackra\Storage\Contracts\Data\FileInterface;
use Stackra\Storage\Contracts\Data\FileVariantInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(FileVariantInterface::TABLE, function (Blueprint $table): void {
            $table->string(FileVariantInterface::ATTR_ID, 64)->primary();

            $table->string(FileVariantInterface::ATTR_FILE_ID, 64);
            $table->foreign(FileVariantInterface::ATTR_FILE_ID)
                ->references(FileInterface::ATTR_ID)
                ->on(FileInterface::TABLE)
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(FileVariantInterface::ATTR_TENANT_ID, 64);
            $table->foreign(FileVariantInterface::ATTR_TENANT_ID)
                ->references('id')
                ->on('tenants')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(FileVariantInterface::ATTR_VARIANT_KEY, 64);
            $table->string(FileVariantInterface::ATTR_GENERATED_BY_CONVERSION, 191);
            $table->string(FileVariantInterface::ATTR_MIME_TYPE, 128);
            $table->integer(FileVariantInterface::ATTR_WIDTH)->nullable();
            $table->integer(FileVariantInterface::ATTR_HEIGHT)->nullable();
            $table->bigInteger(FileVariantInterface::ATTR_SIZE_BYTES);
            $table->string(FileVariantInterface::ATTR_DISK, 32);
            $table->string(FileVariantInterface::ATTR_PATH, 1024);
            $table->timestampTz(FileVariantInterface::ATTR_GENERATED_AT);
            $table->jsonb(FileVariantInterface::ATTR_METADATA)->nullable();

            $table->uuid(FileVariantInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(FileVariantInterface::ATTR_UPDATED_BY)->nullable();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            $table->unique(
                [FileVariantInterface::ATTR_FILE_ID, FileVariantInterface::ATTR_VARIANT_KEY],
                'file_variants_key_unique',
            );

            $table->index(
                [FileVariantInterface::ATTR_TENANT_ID, FileVariantInterface::ATTR_VARIANT_KEY],
                'file_variants_tenant_key_idx',
            );

            $table->index(FileVariantInterface::ATTR_FILE_ID, 'file_variants_file_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(FileVariantInterface::TABLE);
    }
};
