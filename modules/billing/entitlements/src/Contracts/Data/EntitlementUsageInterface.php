<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Contracts\Data;

use Academorix\Entitlements\Models\EntitlementUsage;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `entitlement_usages` table.
 *
 * Append-only audit row for one consumption event. NO soft deletes —
 * retention is handled by `PruneUsageJob` (per entitlement's declared
 * retention window). The `key` column is denormalised from the parent
 * `Entitlement` for hot-path queries; the `current_period_key` column
 * (e.g. `2026-07` for monthly) drives per-period aggregation.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Bind(EntitlementUsage::class)]
interface EntitlementUsageInterface
{
    public const string TABLE = 'entitlement_usages';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'usg';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                 = 'id';
    public const string ATTR_TENANT_ID          = 'tenant_id';
    public const string ATTR_ENTITLEMENT_ID     = 'entitlement_id';
    public const string ATTR_KEY                = 'key';
    public const string ATTR_DELTA              = 'delta';
    public const string ATTR_REASON             = 'reason';
    public const string ATTR_ACTOR_TYPE         = 'actor_type';
    public const string ATTR_ACTOR_ID           = 'actor_id';
    public const string ATTR_CORRELATION_ID     = 'correlation_id';
    public const string ATTR_CURRENT_PERIOD_KEY = 'current_period_key';
    public const string ATTR_METADATA           = 'metadata';
    public const string ATTR_CREATED_BY         = 'created_by';
    public const string ATTR_UPDATED_BY         = 'updated_by';
    public const string ATTR_CREATED_AT         = 'created_at';
    public const string ATTR_UPDATED_AT         = 'updated_at';
}
