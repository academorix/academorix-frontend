<?php

declare(strict_types=1);

namespace Stackra\Transfer\Contracts\Data;

use Stackra\Transfer\Models\XferShard;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `xfer_shards` table.
 *
 * One row per range-limited sub-job when a large operation is
 * sharded. Aggregated back into the parent `xfer_jobs.counters` by
 * `XferShardObserver::updated`.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Bind(XferShard::class)]
interface XferShardInterface
{
    public const string TABLE = 'xfer_shards';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'xshd';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID            = 'id';
    public const string ATTR_TENANT_ID     = 'tenant_id';
    public const string ATTR_XFER_JOB_ID   = 'xfer_job_id';
    public const string ATTR_INDEX         = 'shard_index';
    public const string ATTR_SHEET_NAME    = 'sheet_name';
    public const string ATTR_OFFSET        = 'row_offset';
    public const string ATTR_LIMIT         = 'row_limit';
    public const string ATTR_STATUS        = 'status';
    public const string ATTR_ATTEMPT       = 'attempt';
    public const string ATTR_STARTED_AT    = 'started_at';
    public const string ATTR_FINISHED_AT   = 'finished_at';
    public const string ATTR_ERROR_CODE    = 'error_code';
    public const string ATTR_ERROR_MESSAGE = 'error_message';
    public const string ATTR_COUNTERS      = 'counters';
    public const string ATTR_CREATED_AT    = 'created_at';
    public const string ATTR_UPDATED_AT    = 'updated_at';
}
