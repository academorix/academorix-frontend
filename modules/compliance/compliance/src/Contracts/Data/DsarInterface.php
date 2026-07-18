<?php

declare(strict_types=1);

namespace Academorix\Compliance\Contracts\Data;

use Academorix\Compliance\Models\Dsar;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `dsars` table.
 *
 * One row per data-subject request. The state machine + action
 * columns drive the DSAR orchestrator. `verified_at` is populated
 * out-of-band during platform-admin triage.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(Dsar::class)]
interface DsarInterface
{
    public const string TABLE = 'dsars';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'dsr';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                    = 'id';
    public const string ATTR_TENANT_ID             = 'tenant_id';
    public const string ATTR_SUBJECT_TYPE          = 'subject_type';
    public const string ATTR_SUBJECT_ID            = 'subject_id';
    public const string ATTR_ACTION                = 'action';
    public const string ATTR_STATE                 = 'state';
    public const string ATTR_ASSIGNED_REVIEWER_ID  = 'assigned_reviewer_id';
    public const string ATTR_REQUESTED_AT          = 'requested_at';
    public const string ATTR_VERIFIED_AT           = 'verified_at';
    public const string ATTR_DELIVERED_AT          = 'delivered_at';
    public const string ATTR_REJECTED_AT           = 'rejected_at';
    public const string ATTR_REJECTION_REASON      = 'rejection_reason';
    public const string ATTR_SLA_DAYS              = 'sla_days';
    public const string ATTR_ARTEFACT_COUNT        = 'artefact_count';
    public const string ATTR_DOWNLOAD_SIGNATURE    = 'download_signature';
    public const string ATTR_DOWNLOAD_EXPIRES_AT   = 'download_expires_at';
    public const string ATTR_NOTES                 = 'notes';
    public const string ATTR_METADATA              = 'metadata';
    public const string ATTR_CREATED_BY            = 'created_by';
    public const string ATTR_UPDATED_BY            = 'updated_by';
    public const string ATTR_DELETED_BY            = 'deleted_by';
    public const string ATTR_CREATED_AT            = 'created_at';
    public const string ATTR_UPDATED_AT            = 'updated_at';
    public const string ATTR_DELETED_AT            = 'deleted_at';
}
