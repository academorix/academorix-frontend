<?php

declare(strict_types=1);

namespace Academorix\Notifications\Contracts\Data;

use Academorix\Notifications\Models\NotificationPreference;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `notification_preferences` table.
 *
 * Per-user opt-in per `(category, channel)` with quiet hours + digest
 * mode. NOT soft-deleted — preferences are hard-deleted on GDPR Art. 17
 * user erasure. `quiet_hours_*` is an inclusive range in the user's
 * `quiet_hours_timezone` (defaults to the profile timezone).
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Bind(NotificationPreference::class)]
interface NotificationPreferenceInterface
{
    public const string TABLE = 'notification_preferences';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'pref';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                   = 'id';
    public const string ATTR_TENANT_ID            = 'tenant_id';
    public const string ATTR_USER_ID              = 'user_id';
    public const string ATTR_CATEGORY_SLUG        = 'category_slug';
    public const string ATTR_CHANNEL              = 'channel';
    public const string ATTR_ENABLED              = 'enabled';
    public const string ATTR_DIGEST_MODE          = 'digest_mode';
    public const string ATTR_QUIET_HOURS_START    = 'quiet_hours_start';
    public const string ATTR_QUIET_HOURS_END      = 'quiet_hours_end';
    public const string ATTR_QUIET_HOURS_TIMEZONE = 'quiet_hours_timezone';
    public const string ATTR_METADATA             = 'metadata';
    public const string ATTR_CREATED_BY           = 'created_by';
    public const string ATTR_UPDATED_BY           = 'updated_by';
    public const string ATTR_CREATED_AT           = 'created_at';
    public const string ATTR_UPDATED_AT           = 'updated_at';
}
