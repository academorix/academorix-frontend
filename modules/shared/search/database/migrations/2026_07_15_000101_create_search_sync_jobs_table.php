<?php

declare(strict_types=1);

use Academorix\Search\Contracts\Data\SearchSyncJobInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `search_sync_jobs` table.
 *
 * Operational record for one reindex / backfill / flush / alias-swap /
 * single-document sync.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(SearchSyncJobInterface::TABLE, function (Blueprint $table): void {
            // Primary key — prefixed ULID `ssync_<26 chars>`.
            $table->string(SearchSyncJobInterface::ATTR_ID, 64)->primary();

            $table->string(SearchSyncJobInterface::ATTR_TENANT_ID, 64)->nullable();
            $table->string(SearchSyncJobInterface::ATTR_SEARCH_INDEX_ID, 64);

            // Kind + state machine.
            $table->string(SearchSyncJobInterface::ATTR_KIND, 32);
            $table->string(SearchSyncJobInterface::ATTR_STATUS, 32)->default('queued');
            $table->string(SearchSyncJobInterface::ATTR_SOURCE, 32)->default('live');
            $table->string(SearchSyncJobInterface::ATTR_SOURCE_ARTIFACT_ID, 64)->nullable();
            $table->integer(SearchSyncJobInterface::ATTR_SOURCE_VERSION)->nullable();
            $table->integer(SearchSyncJobInterface::ATTR_TARGET_VERSION)->nullable();

            // Sharding progress.
            $table->integer(SearchSyncJobInterface::ATTR_SHARDS_TOTAL)->default(0);
            $table->integer(SearchSyncJobInterface::ATTR_SHARDS_COMPLETED)->default(0);
            $table->smallInteger(SearchSyncJobInterface::ATTR_PROGRESS_PERCENT)->default(0);
            $table->jsonb(SearchSyncJobInterface::ATTR_COUNTERS)->nullable();

            // Request DTO snapshot.
            $table->jsonb(SearchSyncJobInterface::ATTR_PARAMS)->nullable();

            $table->string(SearchSyncJobInterface::ATTR_RETENTION_TIER, 16)->default('medium');

            // Causer (polymorphic).
            $table->string(SearchSyncJobInterface::ATTR_CAUSER_TYPE, 191)->nullable();
            $table->string(SearchSyncJobInterface::ATTR_CAUSER_ID, 64)->nullable();

            // Frozen notification preferences.
            $table->jsonb(SearchSyncJobInterface::ATTR_NOTIFY_CHANNELS)->nullable();
            $table->string(SearchSyncJobInterface::ATTR_NOTIFY_LOCALE, 8)->nullable();

            // Queue metadata.
            $table->string(SearchSyncJobInterface::ATTR_QUEUE_CONNECTION, 64)->nullable();
            $table->string(SearchSyncJobInterface::ATTR_QUEUE_NAME, 64)->nullable();
            $table->string(SearchSyncJobInterface::ATTR_LARAVEL_QUEUE_BATCH_ID, 64)->nullable();

            // Timing.
            $table->timestampTz(SearchSyncJobInterface::ATTR_STARTED_AT)->nullable();
            $table->timestampTz(SearchSyncJobInterface::ATTR_FINISHED_AT)->nullable();
            $table->timestampTz(SearchSyncJobInterface::ATTR_LAST_PROGRESS_AT)->nullable();

            // Failure info.
            $table->string(SearchSyncJobInterface::ATTR_LAST_ERROR_CODE, 64)->nullable();
            $table->text(SearchSyncJobInterface::ATTR_LAST_ERROR_MESSAGE)->nullable();

            // Cancellation.
            $table->string(SearchSyncJobInterface::ATTR_CANCELLED_BY_TYPE, 191)->nullable();
            $table->string(SearchSyncJobInterface::ATTR_CANCELLED_BY_ID, 64)->nullable();
            $table->text(SearchSyncJobInterface::ATTR_CANCEL_REASON)->nullable();

            // Userstamps + timestamps + soft delete.
            $table->uuid(SearchSyncJobInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(SearchSyncJobInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(SearchSyncJobInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            $table->index(
                [SearchSyncJobInterface::ATTR_TENANT_ID, SearchSyncJobInterface::ATTR_CREATED_AT],
                'search_sync_jobs_tenant_created_index',
            );

            $table->index(
                [SearchSyncJobInterface::ATTR_SEARCH_INDEX_ID, SearchSyncJobInterface::ATTR_STATUS],
                'search_sync_jobs_index_status_index',
            );

            $table->index(
                SearchSyncJobInterface::ATTR_STATUS,
                'search_sync_jobs_status_index',
            );

            $table->index(
                [SearchSyncJobInterface::ATTR_CAUSER_TYPE, SearchSyncJobInterface::ATTR_CAUSER_ID],
                'search_sync_jobs_causer_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(SearchSyncJobInterface::TABLE);
    }
};
