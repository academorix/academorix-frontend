<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Contracts\Data;

use Stackra\Entitlements\Models\Entitlement;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `entitlements` table.
 *
 * One row per `(tenant_id, key)` tuple. The `value` JSONB column is
 * kind-dependent: `{limit, used}` for slot + pool, `{enabled}` for
 * boolean, `{}` for unlimited. Period columns are populated only for
 * pool-kind rows.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Bind(Entitlement::class)]
interface EntitlementInterface
{
    public const string TABLE = 'entitlements';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'ent';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                       = 'id';
    public const string ATTR_APPLICATION_ID           = 'application_id';
    public const string ATTR_TENANT_ID                = 'tenant_id';
    public const string ATTR_KEY                      = 'key';
    public const string ATTR_KIND                     = 'kind';
    public const string ATTR_VALUE                    = 'value';
    public const string ATTR_PERIOD                   = 'period';
    public const string ATTR_CURRENT_PERIOD_STARTS_AT = 'current_period_starts_at';
    public const string ATTR_CURRENT_PERIOD_ENDS_AT   = 'current_period_ends_at';
    public const string ATTR_SOURCE                   = 'source';
    public const string ATTR_PLAN_ID                  = 'plan_id';
    public const string ATTR_NOTES                    = 'notes';
    public const string ATTR_METADATA                 = 'metadata';
    public const string ATTR_CREATED_BY               = 'created_by';
    public const string ATTR_UPDATED_BY               = 'updated_by';
    public const string ATTR_DELETED_BY               = 'deleted_by';
    public const string ATTR_CREATED_AT               = 'created_at';
    public const string ATTR_UPDATED_AT               = 'updated_at';
    public const string ATTR_DELETED_AT               = 'deleted_at';
}
