<?php

declare(strict_types=1);

namespace Academorix\Domains\Contracts\Data;

use Academorix\Domains\Models\Domain;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `domains` table.
 *
 * Custom hostname per Tenant. Carries `application_id` directly so
 * central-host lookup can query
 * `WHERE application_id = ? AND host = ?` before the tenant is
 * resolved.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[Bind(Domain::class)]
interface DomainInterface
{
    public const string TABLE = 'domains';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'dom';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                      = 'id';
    public const string ATTR_APPLICATION_ID          = 'application_id';
    public const string ATTR_TENANT_ID               = 'tenant_id';
    public const string ATTR_HOST                    = 'host';
    public const string ATTR_KIND                    = 'kind';
    public const string ATTR_IS_PRIMARY              = 'is_primary';
    public const string ATTR_VERIFIED_AT             = 'verified_at';
    public const string ATTR_VERIFICATION_TOKEN      = 'verification_token';
    public const string ATTR_VERIFICATION_METHOD     = 'verification_method';
    public const string ATTR_VERIFICATION_ATTEMPTS   = 'verification_attempts';
    public const string ATTR_VERIFICATION_LAST_ERROR = 'verification_last_error';
    public const string ATTR_SSL_STATUS              = 'ssl_status';
    public const string ATTR_SSL_ISSUED_AT           = 'ssl_issued_at';
    public const string ATTR_SSL_EXPIRES_AT          = 'ssl_expires_at';
    public const string ATTR_METADATA                = 'metadata';
    public const string ATTR_CREATED_BY              = 'created_by';
    public const string ATTR_UPDATED_BY              = 'updated_by';
    public const string ATTR_DELETED_BY              = 'deleted_by';
    public const string ATTR_CREATED_AT              = 'created_at';
    public const string ATTR_UPDATED_AT              = 'updated_at';
    public const string ATTR_DELETED_AT              = 'deleted_at';
}
