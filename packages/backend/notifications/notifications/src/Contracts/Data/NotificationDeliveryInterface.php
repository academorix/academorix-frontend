<?php

declare(strict_types=1);

namespace Stackra\Notifications\Contracts\Data;

use Stackra\Notifications\Models\NotificationDelivery;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `notification_deliveries` table.
 *
 * Per-channel delivery attempt for a parent `Notification`. One row per
 * `(notification, channel, attempt)` tuple — retries create a new row
 * with an incremented `attempt` counter so every send is auditable.
 * `opened_ip` is masked at rest (last octet zeroed) per foundation's
 * audit_log convention.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Bind(NotificationDelivery::class)]
interface NotificationDeliveryInterface
{
    public const string TABLE = 'notification_deliveries';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'delv';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                  = 'id';
    public const string ATTR_TENANT_ID           = 'tenant_id';
    public const string ATTR_NOTIFICATION_ID     = 'notification_id';
    public const string ATTR_CHANNEL             = 'channel';
    public const string ATTR_PROVIDER            = 'provider';
    public const string ATTR_PROVIDER_MESSAGE_ID = 'provider_message_id';
    public const string ATTR_STATE               = 'state';
    public const string ATTR_ATTEMPT             = 'attempt';
    public const string ATTR_ATTEMPTED_AT        = 'attempted_at';
    public const string ATTR_DELIVERED_AT        = 'delivered_at';
    public const string ATTR_FAILED_AT           = 'failed_at';
    public const string ATTR_OPENED_AT           = 'opened_at';
    public const string ATTR_OPENED_IP           = 'opened_ip';
    public const string ATTR_OPENED_USER_AGENT   = 'opened_user_agent';
    public const string ATTR_LAST_CLICK_AT       = 'last_click_at';
    public const string ATTR_ERROR_CODE          = 'error_code';
    public const string ATTR_ERROR_MESSAGE       = 'error_message';
    public const string ATTR_RETRY_COUNT         = 'retry_count';
    public const string ATTR_NEXT_RETRY_AT       = 'next_retry_at';
    public const string ATTR_COST_MICRO_UNITS    = 'cost_micro_units';
    public const string ATTR_METADATA            = 'metadata';
    public const string ATTR_CREATED_BY          = 'created_by';
    public const string ATTR_UPDATED_BY          = 'updated_by';
    public const string ATTR_DELETED_BY          = 'deleted_by';
    public const string ATTR_CREATED_AT          = 'created_at';
    public const string ATTR_UPDATED_AT          = 'updated_at';
    public const string ATTR_DELETED_AT          = 'deleted_at';
}
