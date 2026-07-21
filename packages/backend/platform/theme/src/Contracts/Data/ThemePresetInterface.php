<?php

declare(strict_types=1);

namespace Stackra\Theme\Contracts\Data;

use Stackra\Theme\Models\ThemePreset;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `theme_presets` table.
 *
 * Dual-source catalogue (see `.kiro/steering/enum-db-seed-dual-source.md`).
 * System rows carry `is_system = true` and `tenant_id = null` and mirror
 * every non-`Custom` case of {@see \Stackra\Theme\Enums\ThemePresetSlug}.
 * Tenant-authored rows carry `is_system = false` and a non-null
 * `tenant_id` — visible to their owning tenant only.
 *
 * @category Theme
 *
 * @since    0.1.0
 */
#[Bind(ThemePreset::class)]
interface ThemePresetInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'theme_presets';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key column type — string (ULID with prefix `tps_`).
     */
    public const string KEY_TYPE = 'string';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                    = 'id';
    public const string ATTR_TENANT_ID             = 'tenant_id';
    public const string ATTR_SLUG                  = 'slug';
    public const string ATTR_NAME                  = 'name';
    public const string ATTR_DESCRIPTION           = 'description';
    public const string ATTR_MODE                  = 'mode';
    public const string ATTR_CATEGORY              = 'category';
    public const string ATTR_TOKENS                = 'tokens';
    public const string ATTR_PREVIEW_THUMBNAIL_URL = 'preview_thumbnail_url';
    public const string ATTR_IS_ACTIVE             = 'is_active';
    public const string ATTR_IS_SYSTEM             = 'is_system';
    public const string ATTR_CREATED_BY_USER_ID    = 'created_by_user_id';
    public const string ATTR_METADATA              = 'metadata';
    public const string ATTR_CREATED_BY            = 'created_by';
    public const string ATTR_UPDATED_BY            = 'updated_by';
    public const string ATTR_DELETED_BY            = 'deleted_by';
    public const string ATTR_DELETED_AT            = 'deleted_at';
    public const string ATTR_CREATED_AT            = 'created_at';
    public const string ATTR_UPDATED_AT            = 'updated_at';
}
