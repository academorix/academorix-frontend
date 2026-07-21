<?php

declare(strict_types=1);

namespace Stackra\Compliance\Contracts\Data;

use Stackra\Compliance\Models\RetentionRun;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `retention_runs` table.
 *
 * One row per tenant per sweep. Aggregate counts drive the audit
 * report; per-row detail lives in a companion `retention_run_items`
 * table not modelled here (future work).
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(RetentionRun::class)]
interface RetentionRunInterface
{
    public const string TABLE = 'retention_runs';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'rtr';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID              = 'id';
    public const string ATTR_TENANT_ID       = 'tenant_id';
    public const string ATTR_STARTED_AT      = 'started_at';
    public const string ATTR_FINISHED_AT     = 'finished_at';
    public const string ATTR_STATUS          = 'status';
    public const string ATTR_TRIGGER         = 'trigger';
    public const string ATTR_TRIGGERED_BY    = 'triggered_by';
    public const string ATTR_PURGED_COUNT    = 'purged_count';
    public const string ATTR_ANONYMIZED_COUNT = 'anonymized_count';
    public const string ATTR_ARCHIVED_COUNT  = 'archived_count';
    public const string ATTR_HELD_COUNT      = 'held_count';
    public const string ATTR_SKIPPED_COUNT   = 'skipped_count';
    public const string ATTR_FAILED_COUNT    = 'failed_count';
    public const string ATTR_SUMMARY         = 'summary';
    public const string ATTR_METADATA        = 'metadata';
    public const string ATTR_CREATED_AT      = 'created_at';
    public const string ATTR_UPDATED_AT      = 'updated_at';
}
