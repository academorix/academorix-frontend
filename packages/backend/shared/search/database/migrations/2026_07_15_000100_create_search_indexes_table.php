<?php

declare(strict_types=1);

use Stackra\Search\Contracts\Data\SearchIndexInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `search_indexes` table.
 *
 * Registry row for one `#[Searchable]` model class. `tenant_id` is
 * nullable for platform-wide indexes.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(SearchIndexInterface::TABLE, function (Blueprint $table): void {
            // Primary key — prefixed ULID `sidx_<26 chars>`.
            $table->string(SearchIndexInterface::ATTR_ID, 64)->primary();

            $table->string(SearchIndexInterface::ATTR_TENANT_ID, 64)->nullable();

            // Model + engine.
            $table->string(SearchIndexInterface::ATTR_MODEL_CLASS, 255);
            $table->string(SearchIndexInterface::ATTR_ENGINE, 32);

            // Physical index + alias.
            $table->string(SearchIndexInterface::ATTR_INDEX_NAME, 191);
            $table->string(SearchIndexInterface::ATTR_LIVE_ALIAS, 191);
            $table->integer(SearchIndexInterface::ATTR_CURRENT_VERSION)->default(1);

            // Lifecycle state.
            $table->string(SearchIndexInterface::ATTR_STATUS, 32)->default('registering');
            $table->string(SearchIndexInterface::ATTR_LANGUAGE, 8)->nullable();

            // Document + timing counters.
            $table->integer(SearchIndexInterface::ATTR_DOCUMENT_COUNT)->default(0);
            $table->timestampTz(SearchIndexInterface::ATTR_LAST_INDEXED_AT)->nullable();
            $table->timestampTz(SearchIndexInterface::ATTR_LAST_SWAP_AT)->nullable();

            // Compiled specs — JSON blobs from #[SearchField] /
            // #[SearchFacet] / #[SearchBoost] discovery.
            $table->jsonb(SearchIndexInterface::ATTR_FIELD_SPECS)->nullable();
            $table->jsonb(SearchIndexInterface::ATTR_FACET_SPECS)->nullable();
            $table->jsonb(SearchIndexInterface::ATTR_BOOST_SPECS)->nullable();

            // Config drift detection.
            $table->string(SearchIndexInterface::ATTR_CONFIG_HASH, 64)->nullable();

            // Retention.
            $table->string(SearchIndexInterface::ATTR_RETENTION_TIER, 16)->default('medium');

            // Free-form metadata.
            $table->jsonb(SearchIndexInterface::ATTR_METADATA)->nullable();

            // Userstamps + timestamps + soft delete.
            $table->uuid(SearchIndexInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(SearchIndexInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(SearchIndexInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            $table->unique(
                [SearchIndexInterface::ATTR_TENANT_ID, SearchIndexInterface::ATTR_MODEL_CLASS],
                'search_indexes_tenant_model_unique',
            );

            $table->unique(
                SearchIndexInterface::ATTR_INDEX_NAME,
                'search_indexes_index_name_unique',
            );

            $table->index(
                [SearchIndexInterface::ATTR_TENANT_ID, SearchIndexInterface::ATTR_STATUS],
                'search_indexes_tenant_status_index',
            );

            $table->index(
                SearchIndexInterface::ATTR_ENGINE,
                'search_indexes_engine_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(SearchIndexInterface::TABLE);
    }
};
