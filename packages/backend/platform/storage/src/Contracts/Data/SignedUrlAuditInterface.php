<?php

declare(strict_types=1);

namespace Academorix\Storage\Contracts\Data;

use Academorix\Storage\Models\SignedUrlAudit;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `signed_url_audits` table.
 *
 * Append-only log — one row per signed URL issued. Powers
 * revocation, compliance reporting, and abuse detection.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Bind(SignedUrlAudit::class)]
interface SignedUrlAuditInterface
{
    public const string TABLE = 'signed_url_audits';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'sua';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                = 'id';
    public const string ATTR_FILE_ID           = 'file_id';
    public const string ATTR_VARIANT_KEY       = 'variant_key';
    public const string ATTR_TENANT_ID         = 'tenant_id';
    public const string ATTR_ISSUED_BY_USER_ID = 'issued_by_user_id';
    public const string ATTR_ISSUED_BY_SERVICE = 'issued_by_service';
    public const string ATTR_ISSUED_TO_USER_ID = 'issued_to_user_id';
    public const string ATTR_PURPOSE           = 'purpose';
    public const string ATTR_SIGNATURE_HASH    = 'signature_hash';
    public const string ATTR_TTL_SECONDS       = 'ttl_seconds';
    public const string ATTR_ISSUED_AT         = 'issued_at';
    public const string ATTR_EXPIRES_AT        = 'expires_at';
    public const string ATTR_IP_LOCK           = 'ip_lock';
    public const string ATTR_USER_LOCK         = 'user_lock';
    public const string ATTR_ONE_TIME_USE      = 'one_time_use';
    public const string ATTR_HIT_COUNT         = 'hit_count';
    public const string ATTR_LAST_HIT_AT       = 'last_hit_at';
    public const string ATTR_REVOKED_AT        = 'revoked_at';
    public const string ATTR_REVOKED_REASON    = 'revoked_reason';
    public const string ATTR_METADATA          = 'metadata';
    public const string ATTR_CREATED_BY        = 'created_by';
    public const string ATTR_UPDATED_BY        = 'updated_by';
    public const string ATTR_CREATED_AT        = 'created_at';
    public const string ATTR_UPDATED_AT        = 'updated_at';
}
