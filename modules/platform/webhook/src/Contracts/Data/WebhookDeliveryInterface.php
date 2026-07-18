<?php

declare(strict_types=1);

namespace Academorix\Webhook\Contracts\Data;

use Academorix\Webhook\Models\WebhookDelivery;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `webhook_deliveries` table.
 *
 * Append-only per-attempt audit row. One row per attempt — retries
 * create a new row with an incremented `attempt` counter. The
 * `event_id` column carries the source event ULID for idempotency at
 * the receiver end.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Bind(WebhookDelivery::class)]
interface WebhookDeliveryInterface
{
    public const string TABLE = 'webhook_deliveries';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'whd';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID               = 'id';
    public const string ATTR_TENANT_ID        = 'tenant_id';
    public const string ATTR_SUBSCRIPTION_ID  = 'subscription_id';
    public const string ATTR_EVENT_NAME       = 'event_name';
    public const string ATTR_EVENT_ID         = 'event_id';
    public const string ATTR_API_VERSION      = 'api_version';
    public const string ATTR_PAYLOAD          = 'payload';
    public const string ATTR_PAYLOAD_HASH     = 'payload_hash';
    public const string ATTR_ATTEMPT          = 'attempt';
    public const string ATTR_STATUS           = 'status';
    public const string ATTR_HTTP_STATUS_CODE = 'http_status_code';
    public const string ATTR_RESPONSE_HEADERS = 'response_headers';
    public const string ATTR_RESPONSE_BODY    = 'response_body';
    public const string ATTR_LATENCY_MS       = 'latency_ms';
    public const string ATTR_DISPATCHED_AT    = 'dispatched_at';
    public const string ATTR_DELIVERED_AT     = 'delivered_at';
    public const string ATTR_FAILED_AT        = 'failed_at';
    public const string ATTR_RETRY_AT         = 'retry_at';
    public const string ATTR_ERROR_MESSAGE    = 'error_message';
    public const string ATTR_METADATA         = 'metadata';
    public const string ATTR_CREATED_BY       = 'created_by';
    public const string ATTR_UPDATED_BY       = 'updated_by';
    public const string ATTR_CREATED_AT       = 'created_at';
    public const string ATTR_UPDATED_AT       = 'updated_at';
}
