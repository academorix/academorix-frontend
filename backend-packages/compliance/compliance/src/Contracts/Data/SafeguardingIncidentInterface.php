<?php

declare(strict_types=1);

namespace Academorix\Compliance\Contracts\Data;

use Academorix\Compliance\Models\SafeguardingIncident;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `safeguarding_incidents` table.
 *
 * Minor-safeguarding report inbox — distinct from audit
 * (diff-driven) and activity (user-visible feed). Severity drives
 * escalation SLA; `pending_external_referral` flag surfaces
 * critical cases for human handoff.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(SafeguardingIncident::class)]
interface SafeguardingIncidentInterface
{
    public const string TABLE = 'safeguarding_incidents';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'sfi';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                          = 'id';
    public const string ATTR_TENANT_ID                   = 'tenant_id';
    public const string ATTR_SUBJECT_TYPE                = 'subject_type';
    public const string ATTR_SUBJECT_ID                  = 'subject_id';
    public const string ATTR_SEVERITY                    = 'severity';
    public const string ATTR_STATE                       = 'state';
    public const string ATTR_TITLE                       = 'title';
    public const string ATTR_DESCRIPTION                 = 'description';
    public const string ATTR_KEYWORDS                    = 'keywords';
    public const string ATTR_REPORTED_BY_USER_ID         = 'reported_by_user_id';
    public const string ATTR_ASSIGNED_TO_USER_ID         = 'assigned_to_user_id';
    public const string ATTR_REPORTED_AT                 = 'reported_at';
    public const string ATTR_ESCALATED_AT                = 'escalated_at';
    public const string ATTR_RESOLVED_AT                 = 'resolved_at';
    public const string ATTR_ESCALATION_DEADLINE_AT      = 'escalation_deadline_at';
    public const string ATTR_PENDING_EXTERNAL_REFERRAL   = 'pending_external_referral';
    public const string ATTR_EXTERNAL_REFERRAL_REFERENCE = 'external_referral_reference';
    public const string ATTR_METADATA                    = 'metadata';
    public const string ATTR_CREATED_BY                  = 'created_by';
    public const string ATTR_UPDATED_BY                  = 'updated_by';
    public const string ATTR_DELETED_BY                  = 'deleted_by';
    public const string ATTR_CREATED_AT                  = 'created_at';
    public const string ATTR_UPDATED_AT                  = 'updated_at';
    public const string ATTR_DELETED_AT                  = 'deleted_at';
}
