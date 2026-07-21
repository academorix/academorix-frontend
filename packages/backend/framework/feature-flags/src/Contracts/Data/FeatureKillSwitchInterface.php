<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Contracts\Data;

use Stackra\FeatureFlags\Models\FeatureKillSwitch;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `feature_kill_switches` table.
 *
 * Platform-scoped emergency shut-off rows consumed by the resolver's
 * `KillSwitchLayer`. Intentionally has NO `tenant_id` column and
 * the backing model does NOT compose `BelongsToTenant` — tenant
 * targeting is encoded via `(scope_level = 'tenant', scope_value =
 * <tenant id>)`. A `NULL` `scope_value` means "every value at this
 * level" (Requirement 9.7).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Bind(FeatureKillSwitch::class)]
interface FeatureKillSwitchInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'feature_kill_switches';

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
    public const string ATTR_FLAG        = 'flag';
    public const string ATTR_SCOPE_LEVEL = 'scope_level';
    public const string ATTR_SCOPE_VALUE = 'scope_value';
    public const string ATTR_REASON      = 'reason';
    public const string ATTR_ENABLED_AT  = 'enabled_at';
    public const string ATTR_DISABLED_AT = 'disabled_at';
    public const string ATTR_CREATED_BY  = 'created_by';
    public const string ATTR_UPDATED_BY  = 'updated_by';
    public const string ATTR_DELETED_BY  = 'deleted_by';
    public const string ATTR_CREATED_AT  = 'created_at';
    public const string ATTR_UPDATED_AT  = 'updated_at';
    public const string ATTR_DELETED_AT  = 'deleted_at';
}
