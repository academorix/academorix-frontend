<?php

declare(strict_types=1);

namespace Stackra\Notifications\Contracts\Data;

use Stackra\Notifications\Models\Notification;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `notifications` table.
 *
 * The universal delivery record — one row per (recipient, category,
 * template, dispatch). The row carries a denormalised snapshot of the
 * recipient (email + phone + name + locale + timezone) at dispatch time
 * — event-carried state. Downstream consumers never look the recipient
 * up by id; they read the snapshot from the payload.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Bind(Notification::class)]
interface NotificationInterface
{
    public const string TABLE = 'notifications';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'not';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                        = 'id';
    public const string ATTR_TENANT_ID                 = 'tenant_id';
    public const string ATTR_TEMPLATE_ID               = 'template_id';
    public const string ATTR_CATEGORY_SLUG             = 'category_slug';
    public const string ATTR_TEMPLATE_KEY              = 'template_key';
    public const string ATTR_PRIORITY                  = 'priority';
    public const string ATTR_STATE                     = 'state';
    public const string ATTR_ADDRESSEE_TYPE            = 'addressee_type';
    public const string ATTR_ADDRESSEE_ID              = 'addressee_id';
    public const string ATTR_ADDRESSEE_EMAIL           = 'addressee_email';
    public const string ATTR_ADDRESSEE_PHONE           = 'addressee_phone';
    public const string ATTR_ADDRESSEE_NAME            = 'addressee_name';
    public const string ATTR_ADDRESSEE_LOCALE          = 'addressee_locale';
    public const string ATTR_ADDRESSEE_TIMEZONE        = 'addressee_timezone';
    public const string ATTR_ADDRESSEE_CONSENT_GATE    = 'addressee_consent_gate';
    public const string ATTR_ACTOR_TYPE                = 'actor_type';
    public const string ATTR_ACTOR_ID                  = 'actor_id';
    public const string ATTR_SUBJECT                   = 'subject';
    public const string ATTR_PAYLOAD                   = 'payload';
    public const string ATTR_PRIORITY_CHANNELS         = 'priority_channels_requested';
    public const string ATTR_SEEN_AT                   = 'seen_at';
    public const string ATTR_ARCHIVED_AT               = 'archived_at';
    public const string ATTR_METADATA                  = 'metadata';
    public const string ATTR_CREATED_BY                = 'created_by';
    public const string ATTR_UPDATED_BY                = 'updated_by';
    public const string ATTR_DELETED_BY                = 'deleted_by';
    public const string ATTR_CREATED_AT                = 'created_at';
    public const string ATTR_UPDATED_AT                = 'updated_at';
    public const string ATTR_DELETED_AT                = 'deleted_at';
}
