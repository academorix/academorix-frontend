<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Contracts\Data;

use Academorix\Notifications\Mail\Models\MailSuppression;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `mail_suppressions` table.
 *
 * Persisted block-list of email addresses that must NOT be sent to.
 * Rows land in one of four ways:
 *
 *   * Hard bounce webhook (`reason=hard_bounce`, `is_system=false`,
 *     `tenant_id` set).
 *   * Complaint / spam-report webhook (`reason=complaint`, retained
 *     P5Y for CAN-SPAM evidence).
 *   * Preference-layer unsubscribe (`reason=unsubscribed`).
 *   * Manual admin action (`reason=manual`, `tenant_id` set) OR
 *     platform staff (`reason=spam_trap` or platform-wide manual,
 *     `is_system=true`, `tenant_id NULL`).
 *
 * `tenant_id NULL` = platform-wide row applied to every tenant's
 * outbound mail. `tenant_id` set = tenant-scoped row only applied
 * to that tenant's outbound.
 *
 * Composes `HasAuditable` on the model — every add / remove is
 * audit-logged for CAN-SPAM + CASL compliance evidence.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[Bind(MailSuppression::class)]
interface MailSuppressionInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'mail_suppressions';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key type — string, prefixed ULID.
     */
    public const string KEY_TYPE = 'string';

    /**
     * ULID prefix — every generated id lands as `msp_<ulid>`.
     */
    public const string ID_PREFIX = 'msp';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                 = 'id';
    public const string ATTR_TENANT_ID          = 'tenant_id';
    public const string ATTR_EMAIL              = 'email';
    public const string ATTR_EMAIL_DOMAIN       = 'email_domain';
    public const string ATTR_REASON             = 'reason';
    public const string ATTR_PROVIDER           = 'provider';
    public const string ATTR_SOURCE_DELIVERY_ID = 'source_delivery_id';
    public const string ATTR_BOUNCE_REASON      = 'bounce_reason';
    public const string ATTR_IS_SYSTEM          = 'is_system';
    public const string ATTR_METADATA           = 'metadata';
    public const string ATTR_EXPIRES_AT         = 'expires_at';
    public const string ATTR_CREATED_BY         = 'created_by';
    public const string ATTR_UPDATED_BY         = 'updated_by';
    public const string ATTR_DELETED_BY         = 'deleted_by';
    public const string ATTR_CREATED_AT         = 'created_at';
    public const string ATTR_UPDATED_AT         = 'updated_at';
    public const string ATTR_DELETED_AT         = 'deleted_at';
}
