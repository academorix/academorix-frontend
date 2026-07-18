<?php

declare(strict_types=1);

namespace Academorix\Settings\Contracts\Data;

use Academorix\Settings\Models\SettingsGroup;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `settings_groups` table.
 *
 * A settings group is a coherent bundle of related fields surfaced
 * together in the admin UI (`general`, `billing`, `notifications`,
 * ...). System groups (discovered from `#[AsSetting]` at boot) carry
 * `is_system = true` and are immutable via HTTP; tenant-defined
 * groups may exist for enterprise deployments.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Bind(SettingsGroup::class)]
interface SettingsGroupInterface
{
    public const string TABLE = 'settings_groups';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'sgr';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID          = 'id';
    public const string ATTR_KEY         = 'key';
    public const string ATTR_NAME        = 'name';
    public const string ATTR_DESCRIPTION = 'description';
    public const string ATTR_ICON        = 'icon';
    public const string ATTR_SORT_ORDER  = 'sort_order';
    public const string ATTR_IS_SYSTEM   = 'is_system';
    public const string ATTR_METADATA    = 'metadata';
    public const string ATTR_CREATED_BY  = 'created_by';
    public const string ATTR_UPDATED_BY  = 'updated_by';
    public const string ATTR_DELETED_BY  = 'deleted_by';
    public const string ATTR_CREATED_AT  = 'created_at';
    public const string ATTR_UPDATED_AT  = 'updated_at';
    public const string ATTR_DELETED_AT  = 'deleted_at';
}
