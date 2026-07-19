<?php

/**
 * @file modules/platform/storage/database/migrations/2026_07_15_000060_create_files_table.php
 *
 * @description
 * Create the `files` table — the primary domain entity of the
 * storage module. Polymorphic via `fileable_type` /
 * `fileable_id`; content-addressable via `sha256`.
 */

declare(strict_types=1);

use Academorix\Storage\Contracts\Data\FileInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(FileInterface::TABLE, function (Blueprint $table): void {
            // Primary key — prefixed ULID `fil_<26 chars>`.
            $table->string(FileInterface::ATTR_ID, 64)->primary();

            // Tenant boundary.
            $table->string(FileInterface::ATTR_TENANT_ID, 64);
            $table->foreign(FileInterface::ATTR_TENANT_ID)
                ->references('id')
                ->on('tenants')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            // Uploader — nullable for system uploads.
            $table->string(FileInterface::ATTR_OWNER_ID, 64)->nullable();

            // Polymorphic parent.
            $table->string(FileInterface::ATTR_FILEABLE_TYPE, 191)->nullable();
            $table->string(FileInterface::ATTR_FILEABLE_ID, 64)->nullable();

            // Kind + collection.
            $table->string(FileInterface::ATTR_KIND, 64);
            $table->string(FileInterface::ATTR_COLLECTION, 64)->default('default');

            // Name + descriptor.
            $table->string(FileInterface::ATTR_FILENAME, 500);
            $table->string(FileInterface::ATTR_NAME, 500);
            $table->string(FileInterface::ATTR_MIME_TYPE, 128);
            $table->bigInteger(FileInterface::ATTR_SIZE_BYTES);

            // Content addressing + storage location.
            $table->string(FileInterface::ATTR_SHA256, 64);
            $table->string(FileInterface::ATTR_DISK, 32);
            $table->string(FileInterface::ATTR_PATH, 1024);

            // Visibility + virus scan.
            $table->string(FileInterface::ATTR_VISIBILITY, 16)->default('private');
            $table->string(FileInterface::ATTR_VIRUS_SCAN_STATE, 16)->default('pending');
            $table->jsonb(FileInterface::ATTR_VIRUS_SCAN_DETAILS)->nullable();
            $table->timestampTz(FileInterface::ATTR_SCANNED_AT)->nullable();

            // Content-addressable metadata.
            $table->boolean(FileInterface::ATTR_DEDUPABLE)->default(true);
            $table->integer(FileInterface::ATTR_REFERENCE_COUNT)->default(1);

            // Variants + system flag.
            $table->jsonb(FileInterface::ATTR_GENERATED_VARIANTS)->nullable();
            $table->boolean(FileInterface::ATTR_IS_SYSTEM)->default(false);

            // Optional original URL — set for files imported from
            // an external source (used by migrations + backfills).
            $table->string(FileInterface::ATTR_ORIGINAL_URL, 2048)->nullable();

            // Archive marker (distinct from soft delete).
            $table->timestampTz(FileInterface::ATTR_ARCHIVED_AT)->nullable();

            // Spatie MediaLibrary custom_properties + our metadata bag.
            $table->jsonb(FileInterface::ATTR_CUSTOM_PROPERTIES)->nullable();
            $table->jsonb(FileInterface::ATTR_METADATA)->nullable();

            // Userstamps + soft delete + timestamps.
            $table->uuid(FileInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(FileInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(FileInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            $table->index(
                [FileInterface::ATTR_TENANT_ID, FileInterface::ATTR_KIND, FileInterface::ATTR_FILEABLE_TYPE, FileInterface::ATTR_FILEABLE_ID],
                'files_tenant_kind_fileable_idx',
            );

            $table->index(
                [FileInterface::ATTR_TENANT_ID, FileInterface::ATTR_SHA256],
                'files_tenant_sha256_idx',
            );

            $table->index(FileInterface::ATTR_SHA256, 'files_sha256_idx');

            $table->index(
                [FileInterface::ATTR_VIRUS_SCAN_STATE, FileInterface::ATTR_CREATED_AT],
                'files_virus_state_created_idx',
            );

            $table->index(FileInterface::ATTR_ARCHIVED_AT, 'files_archived_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(FileInterface::TABLE);
    }
};
