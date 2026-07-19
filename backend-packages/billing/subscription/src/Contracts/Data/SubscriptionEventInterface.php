<?php

declare(strict_types=1);

namespace Academorix\Subscription\Contracts\Data;

use Academorix\Subscription\Models\SubscriptionEvent;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `subscription_events` table.
 *
 * Append-only audit row for every Subscription state change.
 * Retained 7 years (2555 days) for SOX 404 revenue-recognition
 * evidence. Idempotency is enforced via a unique partial index on
 * `provider_event_id` — Cashier's webhook consumer refuses to
 * write the same event twice.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Bind(SubscriptionEvent::class)]
interface SubscriptionEventInterface
{
    public const string TABLE = 'subscription_events';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'sev';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                = 'id';
    public const string ATTR_TENANT_ID         = 'tenant_id';
    public const string ATTR_SUBSCRIPTION_ID   = 'subscription_id';
    public const string ATTR_KIND              = 'kind';
    public const string ATTR_FROM_STATE        = 'from_state';
    public const string ATTR_TO_STATE          = 'to_state';
    public const string ATTR_FROM_PLAN_ID      = 'from_plan_id';
    public const string ATTR_TO_PLAN_ID        = 'to_plan_id';
    public const string ATTR_AMOUNT_MICRO_UNITS = 'amount_micro_units';
    public const string ATTR_CURRENCY          = 'currency';
    public const string ATTR_OCCURRED_AT       = 'occurred_at';
    public const string ATTR_ACTOR_TYPE        = 'actor_type';
    public const string ATTR_ACTOR_ID          = 'actor_id';
    public const string ATTR_PROVIDER_EVENT_ID = 'provider_event_id';
    public const string ATTR_REASON            = 'reason';
    public const string ATTR_PAYLOAD           = 'payload';
    public const string ATTR_METADATA          = 'metadata';
    public const string ATTR_CREATED_AT        = 'created_at';
    public const string ATTR_UPDATED_AT        = 'updated_at';
}
