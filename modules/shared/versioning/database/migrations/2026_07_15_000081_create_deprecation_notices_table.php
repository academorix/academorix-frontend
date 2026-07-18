<?php

/**
 * @file modules/shared/versioning/database/migrations/2026_07_15_000081_create_deprecation_notices_table.php
 *
 * @description
 * Create the `deprecation_notices` table. FK cascade from
 * `api_version_id` — deleting a version cascades its notices.
 */

declare(strict_types=1);

use Academorix\Versioning\Contracts\Data\ApiVersionInterface;
use Academorix\Versioning\Contracts\Data\DeprecationNoticeInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(DeprecationNoticeInterface::TABLE, function (Blueprint $table): void {
            // Prefixed ULID `dpn_<26 chars>`.
            $table->string(DeprecationNoticeInterface::ATTR_ID, 64)->primary();

            $table->string(DeprecationNoticeInterface::ATTR_API_VERSION_ID, 64);
            $table->foreign(DeprecationNoticeInterface::ATTR_API_VERSION_ID)
                ->references(ApiVersionInterface::ATTR_ID)
                ->on(ApiVersionInterface::TABLE)
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            // Which public surface the notice targets.
            $table->string(DeprecationNoticeInterface::ATTR_SURFACE, 16)->default('all');

            $table->string(DeprecationNoticeInterface::ATTR_TITLE, 200);
            $table->text(DeprecationNoticeInterface::ATTR_BODY);

            // Optional lifecycle window — reminders emit outside these bounds.
            $table->timestampTz(DeprecationNoticeInterface::ATTR_STARTS_AT)->nullable();
            $table->timestampTz(DeprecationNoticeInterface::ATTR_ENDS_AT)->nullable();

            $table->boolean(DeprecationNoticeInterface::ATTR_IS_ACTIVE)->default(true);

            // Optional slug pointing at the replacement version.
            $table->string(DeprecationNoticeInterface::ATTR_REPLACEMENT_VERSION, 32)->nullable();

            $table->jsonb(DeprecationNoticeInterface::ATTR_METADATA)->nullable();

            $table->uuid(DeprecationNoticeInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(DeprecationNoticeInterface::ATTR_UPDATED_BY)->nullable();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Read path — notices affecting a version.
            $table->index(
                [DeprecationNoticeInterface::ATTR_API_VERSION_ID, DeprecationNoticeInterface::ATTR_IS_ACTIVE],
                'deprecation_notices_version_active_index',
            );

            // Read path — notices targeting a surface.
            $table->index(
                [DeprecationNoticeInterface::ATTR_SURFACE, DeprecationNoticeInterface::ATTR_IS_ACTIVE],
                'deprecation_notices_surface_active_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(DeprecationNoticeInterface::TABLE);
    }
};
