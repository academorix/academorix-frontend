<?php

declare(strict_types=1);

use Stackra\Search\Contracts\Data\SearchSynonymInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `search_synonyms` table.
 *
 * Per-tenant + per-language synonym entries. `tenant_id` null =
 * platform-seeded (`is_system = true`).
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(SearchSynonymInterface::TABLE, function (Blueprint $table): void {
            // Primary key — prefixed ULID `syn_<26 chars>`.
            $table->string(SearchSynonymInterface::ATTR_ID, 64)->primary();

            $table->string(SearchSynonymInterface::ATTR_TENANT_ID, 64)->nullable();
            $table->string(SearchSynonymInterface::ATTR_SEARCH_INDEX_ID, 64)->nullable();

            $table->string(SearchSynonymInterface::ATTR_LANGUAGE, 8)->default('en');
            $table->string(SearchSynonymInterface::ATTR_KIND, 32)->default('equivalent');

            // Terms (equivalent / expansion) + one-way pair.
            $table->jsonb(SearchSynonymInterface::ATTR_TERMS)->nullable();
            $table->string(SearchSynonymInterface::ATTR_ONE_WAY_SOURCE, 191)->nullable();
            $table->jsonb(SearchSynonymInterface::ATTR_ONE_WAY_TARGETS)->nullable();

            // Flags.
            $table->boolean(SearchSynonymInterface::ATTR_IS_ACTIVE)->default(true);
            $table->boolean(SearchSynonymInterface::ATTR_IS_SYSTEM)->default(false);

            $table->string(SearchSynonymInterface::ATTR_SOURCE, 32)->default('tenant_admin');
            $table->text(SearchSynonymInterface::ATTR_DESCRIPTION)->nullable();
            $table->jsonb(SearchSynonymInterface::ATTR_METADATA)->nullable();

            // Polymorphic causer.
            $table->string(SearchSynonymInterface::ATTR_CREATED_BY_TYPE, 191)->nullable();
            $table->string(SearchSynonymInterface::ATTR_CREATED_BY_ID, 64)->nullable();

            // Userstamps + timestamps + soft delete.
            $table->uuid(SearchSynonymInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(SearchSynonymInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(SearchSynonymInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            $table->index(
                [SearchSynonymInterface::ATTR_TENANT_ID, SearchSynonymInterface::ATTR_LANGUAGE, SearchSynonymInterface::ATTR_IS_ACTIVE],
                'search_synonyms_scope_active_index',
            );

            $table->index(
                [SearchSynonymInterface::ATTR_LANGUAGE, SearchSynonymInterface::ATTR_IS_SYSTEM],
                'search_synonyms_language_system_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(SearchSynonymInterface::TABLE);
    }
};
