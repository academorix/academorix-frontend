<?php

declare(strict_types=1);

namespace Academorix\Notifications\Contracts\Data;

use Academorix\Notifications\Models\NotificationTemplate;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `notification_templates` table.
 *
 * Versioned reusable template — one row per `(key, channel, locale,
 * version)`. `is_system=true` marks the platform default; a tenant
 * override lives as a same-`key`, same-`channel`, same-`locale` row
 * with the tenant's `tenant_id` set. `body_rendered_html` carries the
 * pre-rendered HTML with Blade placeholders produced by the emails
 * renderer at CI build time.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Bind(NotificationTemplate::class)]
interface NotificationTemplateInterface
{
    public const string TABLE = 'notification_templates';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'tpl';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                    = 'id';
    public const string ATTR_TENANT_ID             = 'tenant_id';
    public const string ATTR_KEY                   = 'key';
    public const string ATTR_CATEGORY_SLUG         = 'category_slug';
    public const string ATTR_CHANNEL               = 'channel';
    public const string ATTR_LOCALE                = 'locale';
    public const string ATTR_VERSION               = 'version';
    public const string ATTR_STATE                 = 'state';
    public const string ATTR_IS_SYSTEM             = 'is_system';
    public const string ATTR_SUBJECT_TEMPLATE      = 'subject_template';
    public const string ATTR_BODY_RENDERED_HTML    = 'body_rendered_html';
    public const string ATTR_PROVIDER_TEMPLATE_ID  = 'provider_template_id';
    public const string ATTR_PUBLISHED_AT          = 'published_at';
    public const string ATTR_METADATA              = 'metadata';
    public const string ATTR_CREATED_BY            = 'created_by';
    public const string ATTR_UPDATED_BY            = 'updated_by';
    public const string ATTR_DELETED_BY            = 'deleted_by';
    public const string ATTR_CREATED_AT            = 'created_at';
    public const string ATTR_UPDATED_AT            = 'updated_at';
    public const string ATTR_DELETED_AT            = 'deleted_at';
}
