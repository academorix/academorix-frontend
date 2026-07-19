<?php

declare(strict_types=1);

namespace Academorix\Transfer\Contracts\Data;

use Academorix\Transfer\Models\XferJob;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `xfer_jobs` table.
 *
 * One row per data-movement operation (import / export / sample). The
 * job row persists independently of the queue-job lifetime — it is
 * the OPERATION, not the queued task.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Bind(XferJob::class)]
interface XferJobInterface
{
    public const string TABLE = 'xfer_jobs';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'xjb';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                 = 'id';
    public const string ATTR_TENANT_ID          = 'tenant_id';
    public const string ATTR_KIND               = 'kind';
    public const string ATTR_ENTITY_KEY         = 'entity_key';
    public const string ATTR_FORMAT             = 'format';
    public const string ATTR_MODE               = 'mode';
    public const string ATTR_STATUS             = 'status';
    public const string ATTR_INITIATOR_USER_ID  = 'initiator_user_id';
    public const string ATTR_SOURCE_PATH        = 'source_path';
    public const string ATTR_SOURCE_SIZE_BYTES  = 'source_size_bytes';
    public const string ATTR_SOURCE_ROW_COUNT   = 'source_row_count';
    public const string ATTR_NOTIFY_CHANNELS    = 'notify_channels';
    public const string ATTR_MAPPING_PROFILE_ID = 'mapping_profile_id';
    public const string ATTR_FILTERS            = 'filters';
    public const string ATTR_INCLUDE_RELATIONS  = 'include_relations';
    public const string ATTR_COLUMNS            = 'columns';
    public const string ATTR_ERROR_ARTIFACT_ID  = 'error_artifact_id';
    public const string ATTR_RESULT_ARTIFACT_ID = 'result_artifact_id';
    public const string ATTR_COUNTERS           = 'counters';
    public const string ATTR_STARTED_AT         = 'started_at';
    public const string ATTR_COMPLETED_AT       = 'completed_at';
    public const string ATTR_FAILED_REASON      = 'failed_reason';
    public const string ATTR_METADATA           = 'metadata';
    public const string ATTR_CREATED_BY         = 'created_by';
    public const string ATTR_UPDATED_BY         = 'updated_by';
    public const string ATTR_DELETED_BY         = 'deleted_by';
    public const string ATTR_CREATED_AT         = 'created_at';
    public const string ATTR_UPDATED_AT         = 'updated_at';
    public const string ATTR_DELETED_AT         = 'deleted_at';
}
