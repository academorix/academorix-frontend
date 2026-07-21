<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Contracts\Data;

use Stackra\FeatureFlags\Models\FeatureRollout;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `feature_rollouts` table.
 *
 * Per-tenant percentage-based enablement rows consumed by the
 * resolver's `RolloutLayer`. There is deliberately NO `scope_value`
 * column — a rollout targets a `scope_level` and the concrete
 * `ScopeValue` is drawn from the caller's active `ScopePath` at
 * evaluation time and fed to `RolloutHasher`. Unique on
 * `(tenant_id, flag, scope_level)` — at most one rollout per flag
 * per level per tenant.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Bind(FeatureRollout::class)]
interface FeatureRolloutInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'feature_rollouts';

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
    public const string ATTR_PERCENTAGE  = 'percentage';
    public const string ATTR_NOTES       = 'notes';
    public const string ATTR_STARTS_AT   = 'starts_at';
    public const string ATTR_ENDS_AT     = 'ends_at';
    public const string ATTR_CREATED_BY  = 'created_by';
    public const string ATTR_UPDATED_BY  = 'updated_by';
    public const string ATTR_DELETED_BY  = 'deleted_by';
    public const string ATTR_CREATED_AT  = 'created_at';
    public const string ATTR_UPDATED_AT  = 'updated_at';
    public const string ATTR_DELETED_AT  = 'deleted_at';
}
