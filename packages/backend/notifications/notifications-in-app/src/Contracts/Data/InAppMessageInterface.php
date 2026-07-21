<?php

declare(strict_types=1);

namespace Stackra\Notifications\InApp\Contracts\Data;

use Stackra\Notifications\InApp\Models\InAppMessage;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `in_app_messages` table.
 *
 * Denormalised inbox row for the user's bell UI. One row per
 * `(tenant_id, addressee_id, notification_id)` — carries a snapshot
 * of the notification's summary fields (title, body preview, action
 * URL, category, priority) so the inbox list can render without
 * joining the base `notifications` table on every read.
 *
 * The row is created synchronously by
 * {@see \Stackra\Notifications\InApp\Listeners\HandleNotificationDispatched}
 * when the parent module fires `NotificationDispatched` with
 * `in_app` in `channels_requested`.
 *
 * Read / dismissed state lives on the sibling
 * {@see InAppMessageReadInterface} table so the message row itself
 * stays immutable — audit trail + concurrency-safe.
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[Bind(InAppMessage::class)]
interface InAppMessageInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'in_app_messages';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key type — string, prefixed ULID.
     */
    public const string KEY_TYPE = 'string';

    /**
     * ULID prefix — every generated id lands as `iam_<ulid>`.
     */
    public const string ID_PREFIX = 'iam';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID              = 'id';
    public const string ATTR_TENANT_ID       = 'tenant_id';
    public const string ATTR_APPLICATION_ID  = 'application_id';
    public const string ATTR_NOTIFICATION_ID = 'notification_id';
    public const string ATTR_ADDRESSEE_ID    = 'addressee_id';
    public const string ATTR_ADDRESSEE_TYPE  = 'addressee_type';
    public const string ATTR_CATEGORY_SLUG   = 'category_slug';
    public const string ATTR_PRIORITY        = 'priority';
    public const string ATTR_TITLE           = 'title';
    public const string ATTR_BODY_PREVIEW    = 'body_preview';
    public const string ATTR_ACTION_URL      = 'action_url';
    public const string ATTR_ICON            = 'icon';
    public const string ATTR_PAYLOAD         = 'payload';
    public const string ATTR_DELIVERED_AT    = 'delivered_at';
    public const string ATTR_METADATA        = 'metadata';
    public const string ATTR_CREATED_BY      = 'created_by';
    public const string ATTR_UPDATED_BY      = 'updated_by';
    public const string ATTR_DELETED_BY      = 'deleted_by';
    public const string ATTR_CREATED_AT      = 'created_at';
    public const string ATTR_UPDATED_AT      = 'updated_at';
    public const string ATTR_DELETED_AT      = 'deleted_at';
}
