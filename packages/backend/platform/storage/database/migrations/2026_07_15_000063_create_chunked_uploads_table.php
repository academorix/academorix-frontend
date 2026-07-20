<?php

/**
 * @file modules/platform/storage/database/migrations/2026_07_15_000063_create_chunked_uploads_table.php
 *
 * @description
 * Create the `chunked_uploads` table — in-flight multipart / tus.io
 * state. Provider handle is unique (partial index on non-null values).
 */

declare(strict_types=1);

use Academorix\Storage\Contracts\Data\ChunkedUploadInterface;
use Academorix\Storage\Contracts\Data\FileInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(ChunkedUploadInterface::TABLE, function (Blueprint $table): void {
            $table->string(ChunkedUploadInterface::ATTR_ID, 64)->primary();

            $table->string(ChunkedUploadInterface::ATTR_TENANT_ID, 64);
            $table->foreign(ChunkedUploadInterface::ATTR_TENANT_ID)
                ->references('id')
                ->on('tenants')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(ChunkedUploadInterface::ATTR_OWNER_ID, 64);

            $table->string(ChunkedUploadInterface::ATTR_TARGET_KIND, 64);
            $table->string(ChunkedUploadInterface::ATTR_TARGET_FILEABLE_TYPE, 191)->nullable();
            $table->string(ChunkedUploadInterface::ATTR_TARGET_FILEABLE_ID, 64)->nullable();

            $table->string(ChunkedUploadInterface::ATTR_PROTOCOL, 16);
            $table->string(ChunkedUploadInterface::ATTR_UPLOAD_URL, 2048);
            $table->string(ChunkedUploadInterface::ATTR_PROVIDER_UPLOAD_ID, 255)->nullable();

            $table->string(ChunkedUploadInterface::ATTR_FILENAME, 500);
            $table->string(ChunkedUploadInterface::ATTR_DECLARED_MIME_TYPE, 128);
            $table->string(ChunkedUploadInterface::ATTR_DECLARED_SHA256, 64)->nullable();

            $table->bigInteger(ChunkedUploadInterface::ATTR_TOTAL_SIZE_BYTES);
            $table->bigInteger(ChunkedUploadInterface::ATTR_UPLOADED_BYTES)->default(0);

            $table->jsonb(ChunkedUploadInterface::ATTR_CHUNKS);
            $table->integer(ChunkedUploadInterface::ATTR_CHUNK_SIZE_BYTES)->default(5_242_880);

            $table->string(ChunkedUploadInterface::ATTR_STATE, 16)->default('initiating');

            $table->timestampTz(ChunkedUploadInterface::ATTR_EXPIRES_AT);
            $table->timestampTz(ChunkedUploadInterface::ATTR_INITIATED_AT);
            $table->timestampTz(ChunkedUploadInterface::ATTR_FINALIZED_AT)->nullable();
            $table->string(ChunkedUploadInterface::ATTR_ABORT_REASON, 128)->nullable();

            $table->string(ChunkedUploadInterface::ATTR_RESULTING_FILE_ID, 64)->nullable();
            $table->foreign(ChunkedUploadInterface::ATTR_RESULTING_FILE_ID)
                ->references(FileInterface::ATTR_ID)
                ->on(FileInterface::TABLE)
                ->nullOnDelete();

            $table->jsonb(ChunkedUploadInterface::ATTR_METADATA)->nullable();

            $table->uuid(ChunkedUploadInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(ChunkedUploadInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(ChunkedUploadInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            $table->index(
                [ChunkedUploadInterface::ATTR_TENANT_ID, ChunkedUploadInterface::ATTR_OWNER_ID, ChunkedUploadInterface::ATTR_STATE],
                'chunked_uploads_tenant_owner_state_idx',
            );

            $table->index(
                [ChunkedUploadInterface::ATTR_STATE, ChunkedUploadInterface::ATTR_EXPIRES_AT],
                'chunked_uploads_state_expires_idx',
            );

            $table->index(
                ChunkedUploadInterface::ATTR_PROVIDER_UPLOAD_ID,
                'chunked_uploads_provider_idx',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(ChunkedUploadInterface::TABLE);
    }
};
