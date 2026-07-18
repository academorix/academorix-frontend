<?php

declare(strict_types=1);

use Academorix\Search\Contracts\Data\SearchSavedQueryInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `search_saved_queries` table.
 *
 * Per-user saved queries + smart lists. `is_shared = true` opens
 * visibility to the whole tenant.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(SearchSavedQueryInterface::TABLE, function (Blueprint $table): void {
            // Primary key — prefixed ULID `sq_<26 chars>`.
            $table->string(SearchSavedQueryInterface::ATTR_ID, 64)->primary();

            $table->string(SearchSavedQueryInterface::ATTR_TENANT_ID, 64);
            $table->string(SearchSavedQueryInterface::ATTR_OWNER_ID, 64);

            $table->string(SearchSavedQueryInterface::ATTR_NAME, 191);
            $table->text(SearchSavedQueryInterface::ATTR_DESCRIPTION)->nullable();

            // Query definition.
            $table->jsonb(SearchSavedQueryInterface::ATTR_ACROSS);
            $table->text(SearchSavedQueryInterface::ATTR_QUERY)->nullable();
            $table->jsonb(SearchSavedQueryInterface::ATTR_FILTERS)->nullable();
            $table->jsonb(SearchSavedQueryInterface::ATTR_FACETS)->nullable();
            $table->jsonb(SearchSavedQueryInterface::ATTR_BOOSTS)->nullable();

            // Flags.
            $table->boolean(SearchSavedQueryInterface::ATTR_IS_SHARED)->default(false);
            $table->boolean(SearchSavedQueryInterface::ATTR_IS_SMART_LIST)->default(false);

            // Usage counters.
            $table->integer(SearchSavedQueryInterface::ATTR_USE_COUNT)->default(0);
            $table->integer(SearchSavedQueryInterface::ATTR_LAST_RESULT_COUNT)->nullable();
            $table->timestampTz(SearchSavedQueryInterface::ATTR_LAST_RUN_AT)->nullable();

            $table->jsonb(SearchSavedQueryInterface::ATTR_METADATA)->nullable();

            // Userstamps + timestamps + soft delete.
            $table->uuid(SearchSavedQueryInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(SearchSavedQueryInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(SearchSavedQueryInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            $table->index(
                [SearchSavedQueryInterface::ATTR_TENANT_ID, SearchSavedQueryInterface::ATTR_OWNER_ID],
                'search_saved_queries_tenant_owner_index',
            );

            $table->index(
                [SearchSavedQueryInterface::ATTR_TENANT_ID, SearchSavedQueryInterface::ATTR_IS_SHARED],
                'search_saved_queries_shared_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(SearchSavedQueryInterface::TABLE);
    }
};
