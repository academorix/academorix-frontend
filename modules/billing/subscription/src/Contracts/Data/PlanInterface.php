<?php

declare(strict_types=1);

namespace Academorix\Subscription\Contracts\Data;

use Academorix\Subscription\Models\Plan;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `plans` table.
 *
 * Per-Application plan definition. Maps to a Stripe Price or Paddle
 * Product ID via `provider_price_id`. `default_entitlements` is the
 * canonical source of entitlement caps for tenants on this plan.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Bind(Plan::class)]
interface PlanInterface
{
    public const string TABLE = 'plans';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'pln';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                    = 'id';
    public const string ATTR_APPLICATION_ID        = 'application_id';
    public const string ATTR_KEY                   = 'key';
    public const string ATTR_NAME                  = 'name';
    public const string ATTR_DESCRIPTION           = 'description';
    public const string ATTR_TIER                  = 'tier';
    public const string ATTR_BILLING_CYCLE         = 'billing_cycle';
    public const string ATTR_BILLING_MODE          = 'billing_mode';
    public const string ATTR_PRICE_MICRO_UNITS     = 'price_micro_units';
    public const string ATTR_CURRENCY              = 'currency';
    public const string ATTR_PROVIDER_PRICE_ID     = 'provider_price_id';
    public const string ATTR_TRIAL_DAYS            = 'trial_days';
    public const string ATTR_DEFAULT_ENTITLEMENTS  = 'default_entitlements';
    public const string ATTR_INCLUDED_FEATURES     = 'included_features';
    public const string ATTR_IS_SYSTEM             = 'is_system';
    public const string ATTR_IS_PUBLIC             = 'is_public';
    public const string ATTR_IS_DEPRECATED         = 'is_deprecated';
    public const string ATTR_SORT_ORDER            = 'sort_order';
    public const string ATTR_ARCHIVED_AT           = 'archived_at';
    public const string ATTR_METADATA              = 'metadata';
    public const string ATTR_CREATED_BY            = 'created_by';
    public const string ATTR_UPDATED_BY            = 'updated_by';
    public const string ATTR_DELETED_BY            = 'deleted_by';
    public const string ATTR_CREATED_AT            = 'created_at';
    public const string ATTR_UPDATED_AT            = 'updated_at';
    public const string ATTR_DELETED_AT            = 'deleted_at';
}
