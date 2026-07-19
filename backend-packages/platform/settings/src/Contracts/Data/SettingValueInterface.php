<?php

declare(strict_types=1);

namespace Academorix\Settings\Contracts\Data;

use Academorix\Settings\Models\SettingValue;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `setting_values` table.
 *
 * One row per `(scope_kind, scope_id, schema_id)` tuple. System-scope
 * rows carry `scope_id = NULL` (platform defaults). Uniqueness
 * enforced by a partial unique index on `(schema_id, scope_kind, scope_id)`
 * where `scope_id` is NOT NULL, plus a plain index on
 * `(schema_id, scope_kind)` for hot-path resolution.
 *
 * `tenant_id` is populated via {@see \Academorix\Tenancy\Concerns\BelongsToTenantOptional}
 * — nullable for system-scope rows, filled from the resolver on save
 * for tenant / user rows.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Bind(SettingValue::class)]
interface SettingValueInterface
{
    public const string TABLE = 'setting_values';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'stv';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID         = 'id';
    public const string ATTR_SCHEMA_ID  = 'schema_id';
    public const string ATTR_SCOPE_KIND = 'scope_kind';
    public const string ATTR_SCOPE_ID   = 'scope_id';
    public const string ATTR_TENANT_ID  = 'tenant_id';
    public const string ATTR_VALUE      = 'value';
    public const string ATTR_METADATA   = 'metadata';
    public const string ATTR_CREATED_BY = 'created_by';
    public const string ATTR_UPDATED_BY = 'updated_by';
    public const string ATTR_CREATED_AT = 'created_at';
    public const string ATTR_UPDATED_AT = 'updated_at';
}
