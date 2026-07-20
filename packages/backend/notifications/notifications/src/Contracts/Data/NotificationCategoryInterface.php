<?php

declare(strict_types=1);

namespace Academorix\Notifications\Contracts\Data;

use Academorix\Notifications\Models\NotificationCategory;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `notification_categories` table.
 *
 * Module-fed category registry. `tenant_id` is nullable — `NULL` rows
 * are platform defaults seeded from every module's `notifications.json`
 * blueprint; a tenant-specific row (same `slug`, `tenant_id` set)
 * overrides the platform default for that tenant.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Bind(NotificationCategory::class)]
interface NotificationCategoryInterface
{
    public const string TABLE = 'notification_categories';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'cat';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID               = 'id';
    public const string ATTR_TENANT_ID        = 'tenant_id';
    public const string ATTR_SLUG             = 'slug';
    public const string ATTR_DISPLAY_NAME     = 'display_name';
    public const string ATTR_DESCRIPTION      = 'description';
    public const string ATTR_OWNING_MODULE    = 'owning_module';
    public const string ATTR_DEFAULT_CHANNELS = 'default_channels';
    public const string ATTR_PRIORITY         = 'priority';
    public const string ATTR_CONSENT_TIER     = 'consent_tier';
    public const string ATTR_OPT_OUT_ALLOWED  = 'opt_out_allowed';
    public const string ATTR_IS_SYSTEM        = 'is_system';
    public const string ATTR_METADATA         = 'metadata';
    public const string ATTR_CREATED_BY       = 'created_by';
    public const string ATTR_UPDATED_BY       = 'updated_by';
    public const string ATTR_DELETED_BY       = 'deleted_by';
    public const string ATTR_CREATED_AT       = 'created_at';
    public const string ATTR_UPDATED_AT       = 'updated_at';
    public const string ATTR_DELETED_AT       = 'deleted_at';
}
