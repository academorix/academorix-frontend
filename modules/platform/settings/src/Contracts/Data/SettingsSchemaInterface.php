<?php

declare(strict_types=1);

namespace Academorix\Settings\Contracts\Data;

use Academorix\Settings\Models\SettingsSchema;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `settings_schemas` table.
 *
 * One row per registered `#[SettingField]` on an `#[AsSetting]` class.
 * Powers the admin UI's form renderer + drives per-field validation on
 * incoming PUT payloads. `sensitive` mirrors the attribute's flag —
 * when true, values are masked in reads unless caller carries
 * `settings.view-sensitive`.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Bind(SettingsSchema::class)]
interface SettingsSchemaInterface
{
    public const string TABLE = 'settings_schemas';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'sss';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID            = 'id';
    public const string ATTR_GROUP_ID      = 'group_id';
    public const string ATTR_KEY           = 'key';
    public const string ATTR_LABEL         = 'label';
    public const string ATTR_DESCRIPTION   = 'description';
    public const string ATTR_TYPE          = 'type';
    public const string ATTR_DEFAULT_VALUE = 'default_value';
    public const string ATTR_RULES         = 'rules';
    public const string ATTR_SENSITIVE     = 'sensitive';
    public const string ATTR_IS_SYSTEM     = 'is_system';
    public const string ATTR_SORT_ORDER    = 'sort_order';
    public const string ATTR_METADATA      = 'metadata';
    public const string ATTR_CREATED_BY    = 'created_by';
    public const string ATTR_UPDATED_BY    = 'updated_by';
    public const string ATTR_DELETED_BY    = 'deleted_by';
    public const string ATTR_CREATED_AT    = 'created_at';
    public const string ATTR_UPDATED_AT    = 'updated_at';
    public const string ATTR_DELETED_AT    = 'deleted_at';
}
