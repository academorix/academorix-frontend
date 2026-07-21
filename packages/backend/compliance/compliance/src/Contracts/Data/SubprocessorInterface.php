<?php

declare(strict_types=1);

namespace Stackra\Compliance\Contracts\Data;

use Stackra\Compliance\Models\Subprocessor;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `subprocessors` table.
 *
 * Platform-level registry — `tenant_id=NULL` always. Every version
 * bump on a row is a DPA amendment; a `version` integer tracks it
 * for downstream notifications.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(Subprocessor::class)]
interface SubprocessorInterface
{
    public const string TABLE = 'subprocessors';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'spr';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                      = 'id';
    public const string ATTR_NAME                    = 'name';
    public const string ATTR_ROLE                    = 'role';
    public const string ATTR_PURPOSE                 = 'purpose';
    public const string ATTR_DATA_CLASSES            = 'data_classes';
    public const string ATTR_LOCATION                = 'location';
    public const string ATTR_LEGAL_BASIS             = 'legal_basis';
    public const string ATTR_DPA_URL                 = 'dpa_url';
    public const string ATTR_WEBSITE_URL             = 'website_url';
    public const string ATTR_ACTIVE_FROM             = 'active_from';
    public const string ATTR_ACTIVE_UNTIL            = 'active_until';
    public const string ATTR_VERSION                 = 'version';
    public const string ATTR_LAST_UPDATED_BY_USER_ID = 'last_updated_by_user_id';
    public const string ATTR_IS_SYSTEM               = 'is_system';
    public const string ATTR_METADATA                = 'metadata';
    public const string ATTR_CREATED_BY              = 'created_by';
    public const string ATTR_UPDATED_BY              = 'updated_by';
    public const string ATTR_DELETED_BY              = 'deleted_by';
    public const string ATTR_CREATED_AT              = 'created_at';
    public const string ATTR_UPDATED_AT              = 'updated_at';
    public const string ATTR_DELETED_AT              = 'deleted_at';
}
