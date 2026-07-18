<?php

declare(strict_types=1);

namespace Academorix\Compliance\Contracts\Data;

use Academorix\Compliance\Models\LegalHold;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `legal_holds` table.
 *
 * Freezes retention on a subject / tenant / case / class scope.
 * Two-person approval enforced by the observer;
 * `applied_by_user_id` and `approved_by_user_id` both required.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(LegalHold::class)]
interface LegalHoldInterface
{
    public const string TABLE = 'legal_holds';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'lhd';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                     = 'id';
    public const string ATTR_TENANT_ID              = 'tenant_id';
    public const string ATTR_SCOPE                  = 'scope';
    public const string ATTR_SUBJECT_TYPE           = 'subject_type';
    public const string ATTR_SUBJECT_ID             = 'subject_id';
    public const string ATTR_TARGET_CLASS           = 'target_class';
    public const string ATTR_CASE_REF               = 'case_ref';
    public const string ATTR_APPLIED_BY_USER_ID     = 'applied_by_user_id';
    public const string ATTR_APPROVED_BY_USER_ID    = 'approved_by_user_id';
    public const string ATTR_REASON                 = 'reason';
    public const string ATTR_APPLIED_AT             = 'applied_at';
    public const string ATTR_EXPIRES_AT             = 'expires_at';
    public const string ATTR_RELEASED_AT            = 'released_at';
    public const string ATTR_RELEASED_BY_USER_ID    = 'released_by_user_id';
    public const string ATTR_METADATA               = 'metadata';
    public const string ATTR_CREATED_BY             = 'created_by';
    public const string ATTR_UPDATED_BY             = 'updated_by';
    public const string ATTR_DELETED_BY             = 'deleted_by';
    public const string ATTR_CREATED_AT             = 'created_at';
    public const string ATTR_UPDATED_AT             = 'updated_at';
    public const string ATTR_DELETED_AT             = 'deleted_at';
}
