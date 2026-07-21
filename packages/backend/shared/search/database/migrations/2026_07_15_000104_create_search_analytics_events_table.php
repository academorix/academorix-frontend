<?php

declare(strict_types=1);

use Stackra\Search\Contracts\Data\SearchAnalyticsEventInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `search_analytics_events` table.
 *
 * Append-only telemetry. No `soft delete` (retention hard-deletes),
 * no userstamps (append-only telemetry doesn't carry a userstamp
 * fingerprint).
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(SearchAnalyticsEventInterface::TABLE, function (Blueprint $table): void {
            // Primary key — prefixed ULID `sae_<26 chars>`.
            $table->string(SearchAnalyticsEventInterface::ATTR_ID, 64)->primary();

            $table->string(SearchAnalyticsEventInterface::ATTR_TENANT_ID, 64)->nullable();
            $table->string(SearchAnalyticsEventInterface::ATTR_USER_ID, 64)->nullable();
            $table->string(SearchAnalyticsEventInterface::ATTR_SEARCH_SESSION_ID, 64)->nullable();
            $table->string(SearchAnalyticsEventInterface::ATTR_SAVED_QUERY_ID, 64)->nullable();

            $table->string(SearchAnalyticsEventInterface::ATTR_KIND, 32);
            $table->string(SearchAnalyticsEventInterface::ATTR_ENGINE, 32);
            $table->jsonb(SearchAnalyticsEventInterface::ATTR_INDEX_NAMES)->nullable();

            // Query text — HIDDEN on the wire, kept in DB for the
            // retention window then scrubbed to NULL by the pruner.
            $table->text(SearchAnalyticsEventInterface::ATTR_QUERY)->nullable();

            // Aggregation-safe fingerprint of the normalised query.
            $table->string(SearchAnalyticsEventInterface::ATTR_QUERY_HASH, 64)->nullable();

            $table->integer(SearchAnalyticsEventInterface::ATTR_RESULT_COUNT)->nullable();
            $table->integer(SearchAnalyticsEventInterface::ATTR_TOOK_MS)->nullable();
            $table->boolean(SearchAnalyticsEventInterface::ATTR_HAD_TYPO_CORRECTION)->default(false);
            $table->boolean(SearchAnalyticsEventInterface::ATTR_WAS_FROM_SAVED_QUERY)->default(false);

            // Click-through payload — populated for kind=click_through.
            $table->string(SearchAnalyticsEventInterface::ATTR_CLICKED_RESULT_TYPE, 191)->nullable();
            $table->string(SearchAnalyticsEventInterface::ATTR_CLICKED_RESULT_ID, 64)->nullable();
            $table->integer(SearchAnalyticsEventInterface::ATTR_CLICKED_POSITION)->nullable();

            $table->string(SearchAnalyticsEventInterface::ATTR_RETENTION_TIER, 16)->default('short');

            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            $table->index(
                [SearchAnalyticsEventInterface::ATTR_TENANT_ID, SearchAnalyticsEventInterface::ATTR_CREATED_AT],
                'search_analytics_events_tenant_time_index',
            );

            $table->index(
                [SearchAnalyticsEventInterface::ATTR_TENANT_ID, SearchAnalyticsEventInterface::ATTR_KIND, SearchAnalyticsEventInterface::ATTR_CREATED_AT],
                'search_analytics_events_tenant_kind_time_index',
            );

            $table->index(
                SearchAnalyticsEventInterface::ATTR_QUERY_HASH,
                'search_analytics_events_query_hash_index',
            );

            $table->index(
                SearchAnalyticsEventInterface::ATTR_USER_ID,
                'search_analytics_events_user_id_index',
            );

            $table->index(
                [SearchAnalyticsEventInterface::ATTR_RETENTION_TIER, SearchAnalyticsEventInterface::ATTR_CREATED_AT],
                'search_analytics_events_retention_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(SearchAnalyticsEventInterface::TABLE);
    }
};
