<?php

declare(strict_types=1);

namespace Stackra\Versioning\Contracts\Data;

use Stackra\Versioning\Models\ApiVersion;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `api_versions` table.
 *
 * One row per registered API version. Global — no tenant column. The
 * `slug` is the primary reference key everywhere (URL path, Accept
 * header, WebhookSubscription pin). Every downstream reads the column
 * names via the `ATTR_*` constants below.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Bind(ApiVersion::class)]
interface ApiVersionInterface
{
    public const string TABLE = 'api_versions';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'apv';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID            = 'id';
    public const string ATTR_SLUG          = 'slug';
    public const string ATTR_SCHEME        = 'scheme';
    public const string ATTR_SCHEME_VALUE  = 'scheme_value';
    public const string ATTR_STATUS        = 'status';
    public const string ATTR_RELEASED_AT   = 'released_at';
    public const string ATTR_DEPRECATED_AT = 'deprecated_at';
    public const string ATTR_SUNSET_AT     = 'sunset_at';
    public const string ATTR_DESCRIPTION   = 'description';
    public const string ATTR_IS_SYSTEM     = 'is_system';
    public const string ATTR_METADATA      = 'metadata';
    public const string ATTR_CREATED_BY    = 'created_by';
    public const string ATTR_UPDATED_BY    = 'updated_by';
    public const string ATTR_DELETED_BY    = 'deleted_by';
    public const string ATTR_CREATED_AT    = 'created_at';
    public const string ATTR_UPDATED_AT    = 'updated_at';
    public const string ATTR_DELETED_AT    = 'deleted_at';
}
