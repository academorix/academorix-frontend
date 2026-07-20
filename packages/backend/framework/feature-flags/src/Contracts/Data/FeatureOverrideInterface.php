<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Contracts\Data;

use Academorix\FeatureFlags\Models\FeatureOverride;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `feature_overrides` table.
 *
 * Per-tenant, per-scope explicit allow/deny rows consumed by the
 * resolver's `OverrideLayer`. Unique on
 * `(tenant_id, flag, scope_level, scope_value)` — at most one
 * active override per subject per flag per tenant. Deepest-wins
 * precedence is applied at query time using `scope_definitions.sort_order`.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Bind(FeatureOverride::class)]
interface FeatureOverrideInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'feature_overrides';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key type — string, prefixed ULID.
     */
    public const string KEY_TYPE = 'string';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID          = 'id';
    public const string ATTR_TENANT_ID   = 'tenant_id';
    public const string ATTR_FLAG        = 'flag';
    public const string ATTR_SCOPE_LEVEL = 'scope_level';
    public const string ATTR_SCOPE_VALUE = 'scope_value';
    public const string ATTR_DECISION    = 'decision';
    public const string ATTR_REASON      = 'reason';
    public const string ATTR_EXPIRES_AT  = 'expires_at';
    public const string ATTR_CREATED_BY  = 'created_by';
    public const string ATTR_UPDATED_BY  = 'updated_by';
    public const string ATTR_DELETED_BY  = 'deleted_by';
    public const string ATTR_CREATED_AT  = 'created_at';
    public const string ATTR_UPDATED_AT  = 'updated_at';
    public const string ATTR_DELETED_AT  = 'deleted_at';
}
