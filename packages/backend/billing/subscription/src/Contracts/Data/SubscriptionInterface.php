<?php

declare(strict_types=1);

namespace Stackra\Subscription\Contracts\Data;

use Stackra\Subscription\Models\Subscription;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `subscriptions` table.
 *
 * Tenant's active subscription. Wraps Cashier's own row via
 * `provider_subscription_id` and adds our own state layer (grace
 * period beyond the provider's default lifecycle).
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Bind(Subscription::class)]
interface SubscriptionInterface
{
    public const string TABLE = 'subscriptions';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'sub';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                       = 'id';
    public const string ATTR_TENANT_ID                = 'tenant_id';
    public const string ATTR_APPLICATION_ID           = 'application_id';
    public const string ATTR_PLAN_ID                  = 'plan_id';
    public const string ATTR_PROVIDER                 = 'provider';
    public const string ATTR_PROVIDER_SUBSCRIPTION_ID = 'provider_subscription_id';
    public const string ATTR_PROVIDER_CUSTOMER_ID     = 'provider_customer_id';
    public const string ATTR_STATE                    = 'state';
    public const string ATTR_BILLING_CYCLE            = 'billing_cycle';
    public const string ATTR_TRIAL_ENDS_AT            = 'trial_ends_at';
    public const string ATTR_CURRENT_PERIOD_START     = 'current_period_start';
    public const string ATTR_CURRENT_PERIOD_END       = 'current_period_end';
    public const string ATTR_GRACE_ENDS_AT            = 'grace_ends_at';
    public const string ATTR_SUSPENDED_AT             = 'suspended_at';
    public const string ATTR_CANCELLED_AT             = 'cancelled_at';
    public const string ATTR_CANCEL_AT_PERIOD_END     = 'cancel_at_period_end';
    public const string ATTR_REINSTATED_AT            = 'reinstated_at';
    public const string ATTR_LAST_PAYMENT_AT          = 'last_payment_at';
    public const string ATTR_LAST_PAYMENT_FAILED_AT   = 'last_payment_failed_at';
    public const string ATTR_CONSECUTIVE_FAILURES     = 'consecutive_failures';
    public const string ATTR_METADATA                 = 'metadata';
    public const string ATTR_CREATED_BY               = 'created_by';
    public const string ATTR_UPDATED_BY               = 'updated_by';
    public const string ATTR_DELETED_BY               = 'deleted_by';
    public const string ATTR_CREATED_AT               = 'created_at';
    public const string ATTR_UPDATED_AT               = 'updated_at';
    public const string ATTR_DELETED_AT               = 'deleted_at';
}
