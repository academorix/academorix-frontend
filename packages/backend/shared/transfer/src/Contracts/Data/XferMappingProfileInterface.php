<?php

declare(strict_types=1);

namespace Stackra\Transfer\Contracts\Data;

use Stackra\Transfer\Models\XferMappingProfile;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `xfer_mapping_profiles` table.
 *
 * Saved header-remap profile per tenant per entity. Reusable across
 * imports — the tenant admin picks a profile at upload time and the
 * import engine uses its `header_map` to rewrite source column names
 * onto the entity's `#[ImportField]` map.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Bind(XferMappingProfile::class)]
interface XferMappingProfileInterface
{
    public const string TABLE = 'xfer_mapping_profiles';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'xmap';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID           = 'id';
    public const string ATTR_TENANT_ID    = 'tenant_id';
    public const string ATTR_OWNER_ID     = 'owner_id';
    public const string ATTR_ENTITY_KEY   = 'entity_key';
    public const string ATTR_NAME         = 'name';
    public const string ATTR_DESCRIPTION  = 'description';
    public const string ATTR_HEADER_MAP   = 'header_map';
    public const string ATTR_START_ROW    = 'start_row';
    public const string ATTR_HEADING_ROW  = 'heading_row';
    public const string ATTR_CSV_SETTINGS = 'csv_settings';
    public const string ATTR_IS_DEFAULT   = 'is_default';
    public const string ATTR_IS_SHARED    = 'is_shared';
    public const string ATTR_USED_COUNT   = 'used_count';
    public const string ATTR_LAST_USED_AT = 'last_used_at';
    public const string ATTR_CREATED_BY   = 'created_by';
    public const string ATTR_UPDATED_BY   = 'updated_by';
    public const string ATTR_DELETED_BY   = 'deleted_by';
    public const string ATTR_CREATED_AT   = 'created_at';
    public const string ATTR_UPDATED_AT   = 'updated_at';
    public const string ATTR_DELETED_AT   = 'deleted_at';
}
