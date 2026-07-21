<?php

/**
 * @file modules/shared/versioning/database/migrations/2026_07_15_000080_create_api_versions_table.php
 *
 * @description
 * Create the `api_versions` table. Global — no tenant column. Unique
 * on `slug` (the primary reference key everywhere).
 */

declare(strict_types=1);

use Stackra\Versioning\Contracts\Data\ApiVersionInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(ApiVersionInterface::TABLE, function (Blueprint $table): void {
            // Prefixed ULID `apv_<26 chars>`.
            $table->string(ApiVersionInterface::ATTR_ID, 64)->primary();

            // Human-readable identifier used everywhere.
            $table->string(ApiVersionInterface::ATTR_SLUG, 32);

            // Scheme + concrete value (semver: `1.0.0`; calver: `2024.10.15`).
            $table->string(ApiVersionInterface::ATTR_SCHEME, 16)->default('semver');
            $table->string(ApiVersionInterface::ATTR_SCHEME_VALUE, 64);

            // Lifecycle state.
            $table->string(ApiVersionInterface::ATTR_STATUS, 16)->default('draft');
            $table->timestampTz(ApiVersionInterface::ATTR_RELEASED_AT)->nullable();
            $table->timestampTz(ApiVersionInterface::ATTR_DEPRECATED_AT)->nullable();
            $table->timestampTz(ApiVersionInterface::ATTR_SUNSET_AT)->nullable();

            // Markdown-formatted description of what changed in this version.
            $table->text(ApiVersionInterface::ATTR_DESCRIPTION)->nullable();

            $table->boolean(ApiVersionInterface::ATTR_IS_SYSTEM)->default(true);

            $table->jsonb(ApiVersionInterface::ATTR_METADATA)->nullable();

            // Userstamps + timestamps + soft delete.
            $table->uuid(ApiVersionInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(ApiVersionInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(ApiVersionInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Slug is the primary lookup path.
            $table->unique(
                ApiVersionInterface::ATTR_SLUG,
                'api_versions_slug_unique',
            );

            // Status filter for the tenant + admin catalog surfaces.
            $table->index(
                ApiVersionInterface::ATTR_STATUS,
                'api_versions_status_index',
            );

            // Sunset scheduler scans by `(status, sunset_at)`.
            $table->index(
                [ApiVersionInterface::ATTR_STATUS, ApiVersionInterface::ATTR_SUNSET_AT],
                'api_versions_status_sunset_at_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(ApiVersionInterface::TABLE);
    }
};
