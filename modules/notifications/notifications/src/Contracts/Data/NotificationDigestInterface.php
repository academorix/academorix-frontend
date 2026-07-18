<?php

declare(strict_types=1);

namespace Academorix\Notifications\Contracts\Data;

use Academorix\Notifications\Models\NotificationDigest;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `notification_digests` table.
 *
 * Batched digest of pending notifications (daily / weekly). One row per
 * `(user, category, channel, window)` — the `notification_ids` column
 * carries the ULID list of items included in the batch. Not audited —
 * 30-day retention with hard purge.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Bind(NotificationDigest::class)]
interface NotificationDigestInterface
{
    public const string TABLE = 'notification_digests';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'dgst';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID               = 'id';
    public const string ATTR_TENANT_ID        = 'tenant_id';
    public const string ATTR_USER_ID          = 'user_id';
    public const string ATTR_CATEGORY_SLUG    = 'category_slug';
    public const string ATTR_CHANNEL          = 'channel';
    public const string ATTR_STATE            = 'state';
    public const string ATTR_SCHEDULED_FOR    = 'scheduled_for';
    public const string ATTR_DELIVERED_AT     = 'delivered_at';
    public const string ATTR_NOTIFICATION_IDS = 'notification_ids';
    public const string ATTR_METADATA         = 'metadata';
    public const string ATTR_CREATED_BY       = 'created_by';
    public const string ATTR_UPDATED_BY       = 'updated_by';
    public const string ATTR_CREATED_AT       = 'created_at';
    public const string ATTR_UPDATED_AT       = 'updated_at';
}
