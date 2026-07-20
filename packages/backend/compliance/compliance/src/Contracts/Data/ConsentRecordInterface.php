<?php

declare(strict_types=1);

namespace Academorix\Compliance\Contracts\Data;

use Academorix\Compliance\Models\ConsentRecord;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `consent_records` table.
 *
 * Immutable audit rows. Withdrawal writes a NEW row rather than
 * mutating the previous grant. The active decision for a
 * (subject, category) tuple is the latest row per that tuple.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(ConsentRecord::class)]
interface ConsentRecordInterface
{
    public const string TABLE = 'consent_records';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'cns';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                  = 'id';
    public const string ATTR_TENANT_ID           = 'tenant_id';
    public const string ATTR_CONSENT_CATEGORY_ID = 'consent_category_id';
    public const string ATTR_CATEGORY_KEY        = 'category_key';
    public const string ATTR_SUBJECT_TYPE        = 'subject_type';
    public const string ATTR_SUBJECT_ID          = 'subject_id';
    public const string ATTR_DECISION            = 'decision';
    public const string ATTR_GUARDIAN_USER_ID    = 'guardian_user_id';
    public const string ATTR_VERIFICATION_METHOD = 'verification_method';
    public const string ATTR_EVIDENCE            = 'evidence';
    public const string ATTR_RECORDED_AT         = 'recorded_at';
    public const string ATTR_SOURCE              = 'source';
    public const string ATTR_METADATA            = 'metadata';
    public const string ATTR_CREATED_BY          = 'created_by';
    public const string ATTR_UPDATED_BY          = 'updated_by';
    public const string ATTR_CREATED_AT          = 'created_at';
    public const string ATTR_UPDATED_AT          = 'updated_at';
}
