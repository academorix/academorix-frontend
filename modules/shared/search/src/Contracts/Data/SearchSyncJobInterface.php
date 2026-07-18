<?php

declare(strict_types=1);

namespace Academorix\Search\Contracts\Data;

use Academorix\Search\Models\SearchSyncJob;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `search_sync_jobs` table.
 *
 * Operational record for one reindex / backfill / flush / alias-swap /
 * single-document sync. Every long-running sync produces exactly one
 * row so admin surfaces + notifications have a durable target to
 * subscribe to.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Bind(SearchSyncJob::class)]
interface SearchSyncJobInterface
{
    public const string TABLE = 'search_sync_jobs';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'ssync';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                     = 'id';
    public const string ATTR_TENANT_ID              = 'tenant_id';
    public const string ATTR_SEARCH_INDEX_ID        = 'search_index_id';
    public const string ATTR_KIND                   = 'kind';
    public const string ATTR_STATUS                 = 'status';
    public const string ATTR_SOURCE                 = 'source';
    public const string ATTR_SOURCE_ARTIFACT_ID     = 'source_artifact_id';
    public const string ATTR_SOURCE_VERSION         = 'source_version';
    public const string ATTR_TARGET_VERSION         = 'target_version';
    public const string ATTR_SHARDS_TOTAL           = 'shards_total';
    public const string ATTR_SHARDS_COMPLETED       = 'shards_completed';
    public const string ATTR_PROGRESS_PERCENT       = 'progress_percent';
    public const string ATTR_COUNTERS               = 'counters';
    public const string ATTR_PARAMS                 = 'params';
    public const string ATTR_RETENTION_TIER         = 'retention_tier';
    public const string ATTR_CAUSER_TYPE            = 'causer_type';
    public const string ATTR_CAUSER_ID              = 'causer_id';
    public const string ATTR_NOTIFY_CHANNELS        = 'notify_channels';
    public const string ATTR_NOTIFY_LOCALE          = 'notify_locale';
    public const string ATTR_QUEUE_CONNECTION       = 'queue_connection';
    public const string ATTR_QUEUE_NAME             = 'queue_name';
    public const string ATTR_LARAVEL_QUEUE_BATCH_ID = 'laravel_queue_batch_id';
    public const string ATTR_STARTED_AT             = 'started_at';
    public const string ATTR_FINISHED_AT            = 'finished_at';
    public const string ATTR_LAST_PROGRESS_AT       = 'last_progress_at';
    public const string ATTR_LAST_ERROR_CODE        = 'last_error_code';
    public const string ATTR_LAST_ERROR_MESSAGE     = 'last_error_message';
    public const string ATTR_CANCELLED_BY_TYPE      = 'cancelled_by_type';
    public const string ATTR_CANCELLED_BY_ID        = 'cancelled_by_id';
    public const string ATTR_CANCEL_REASON          = 'cancel_reason';
    public const string ATTR_CREATED_BY             = 'created_by';
    public const string ATTR_UPDATED_BY             = 'updated_by';
    public const string ATTR_DELETED_BY             = 'deleted_by';
    public const string ATTR_CREATED_AT             = 'created_at';
    public const string ATTR_UPDATED_AT             = 'updated_at';
    public const string ATTR_DELETED_AT             = 'deleted_at';
}
