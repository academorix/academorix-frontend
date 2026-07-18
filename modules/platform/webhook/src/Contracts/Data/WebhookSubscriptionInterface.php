<?php

declare(strict_types=1);

namespace Academorix\Webhook\Contracts\Data;

use Academorix\Webhook\Models\WebhookSubscription;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `webhook_subscriptions` table.
 *
 * One customer-registered subscription: destination + event filter +
 * signing secret (with rotation grace) + rate limit + backoff strategy
 * + auto-disable state. Every column referenced by the module goes
 * through the `ATTR_*` constants below.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Bind(WebhookSubscription::class)]
interface WebhookSubscriptionInterface
{
    public const string TABLE = 'webhook_subscriptions';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'whs';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                        = 'id';
    public const string ATTR_TENANT_ID                 = 'tenant_id';
    public const string ATTR_NAME                      = 'name';
    public const string ATTR_DESTINATION               = 'destination';
    public const string ATTR_DESTINATION_CONFIG        = 'destination_config';
    public const string ATTR_EVENTS                    = 'events';
    public const string ATTR_SIGNING_SECRET            = 'signing_secret';
    public const string ATTR_SIGNING_SECRET_PREVIOUS   = 'signing_secret_previous';
    public const string ATTR_SIGNING_SECRET_ROTATED_AT = 'signing_secret_rotated_at';
    public const string ATTR_API_VERSION               = 'api_version';
    public const string ATTR_STATUS                    = 'status';
    public const string ATTR_CONSECUTIVE_FAILURES      = 'consecutive_failures';
    public const string ATTR_DISABLED_AT               = 'disabled_at';
    public const string ATTR_DISABLED_REASON           = 'disabled_reason';
    public const string ATTR_RATE_LIMIT_PER_MINUTE     = 'rate_limit_per_minute';
    public const string ATTR_BACKOFF_STRATEGY          = 'backoff_strategy';
    public const string ATTR_BACKOFF_CONFIG            = 'backoff_config';
    public const string ATTR_LAST_DELIVERY_AT          = 'last_delivery_at';
    public const string ATTR_HEALTH_PROBE_URL          = 'health_probe_url';
    public const string ATTR_HEALTH_PROBE_LAST_AT      = 'health_probe_last_at';
    public const string ATTR_HEALTH_PROBE_STATUS       = 'health_probe_status';
    public const string ATTR_METADATA                  = 'metadata';
    public const string ATTR_CREATED_BY                = 'created_by';
    public const string ATTR_UPDATED_BY                = 'updated_by';
    public const string ATTR_DELETED_BY                = 'deleted_by';
    public const string ATTR_CREATED_AT                = 'created_at';
    public const string ATTR_UPDATED_AT                = 'updated_at';
    public const string ATTR_DELETED_AT                = 'deleted_at';
}
