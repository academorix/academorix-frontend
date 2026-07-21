<?php

declare(strict_types=1);

namespace Stackra\Versioning\Contracts\Data;

use Stackra\Versioning\Models\DeprecationNotice;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `deprecation_notices` table.
 *
 * A public + auditable record of a deprecation or sunset warning
 * attached to an ApiVersion. Notices carry an active toggle and an
 * optional lifecycle window (`starts_at`/`ends_at`) so multiple
 * notices can be queued against the same version at once.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Bind(DeprecationNotice::class)]
interface DeprecationNoticeInterface
{
    public const string TABLE = 'deprecation_notices';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'dpn';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                  = 'id';
    public const string ATTR_API_VERSION_ID      = 'api_version_id';
    public const string ATTR_SURFACE             = 'surface';
    public const string ATTR_TITLE               = 'title';
    public const string ATTR_BODY                = 'body';
    public const string ATTR_STARTS_AT           = 'starts_at';
    public const string ATTR_ENDS_AT             = 'ends_at';
    public const string ATTR_IS_ACTIVE           = 'is_active';
    public const string ATTR_REPLACEMENT_VERSION = 'replacement_version';
    public const string ATTR_METADATA            = 'metadata';
    public const string ATTR_CREATED_BY          = 'created_by';
    public const string ATTR_UPDATED_BY          = 'updated_by';
    public const string ATTR_CREATED_AT          = 'created_at';
    public const string ATTR_UPDATED_AT          = 'updated_at';
}
