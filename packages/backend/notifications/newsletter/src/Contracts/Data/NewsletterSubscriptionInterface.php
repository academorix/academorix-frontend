<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Contracts\Data;

use Stackra\Newsletter\Models\NewsletterSubscription;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `newsletter_subscriptions` table.
 *
 * One row per (newsletter, email). Carries CAN-SPAM + CASL consent
 * evidence — `source`, `consent_evidence`, `ip_address`
 * (truncated to /24), `user_agent`, `subscribed_at`. Signed HMAC
 * tokens for confirmation + unsubscribe. Engagement score is
 * maintained by
 * {@see \Stackra\Newsletter\Jobs\TrackNewsletterEngagementJob}
 * and drives audience segmentation.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Bind(NewsletterSubscription::class)]
interface NewsletterSubscriptionInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'newsletter_subscriptions';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key type — string, prefixed ULID.
     */
    public const string KEY_TYPE = 'string';

    /**
     * ULID prefix — every generated id lands as `nls_<ulid>`.
     */
    public const string ID_PREFIX = 'nls';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                        = 'id';
    public const string ATTR_TENANT_ID                 = 'tenant_id';
    public const string ATTR_NEWSLETTER_ID             = 'newsletter_id';
    public const string ATTR_USER_ID                   = 'user_id';
    public const string ATTR_EMAIL                     = 'email';
    public const string ATTR_FIRST_NAME                = 'first_name';
    public const string ATTR_LAST_NAME                 = 'last_name';
    public const string ATTR_LOCALE                    = 'locale';
    public const string ATTR_STATUS                    = 'status';
    public const string ATTR_SOURCE                    = 'source';
    public const string ATTR_TAGS                      = 'tags';
    public const string ATTR_CONFIRMATION_TOKEN        = 'confirmation_token';
    public const string ATTR_UNSUBSCRIBE_TOKEN         = 'unsubscribe_token';
    public const string ATTR_CONFIRMATION_EXPIRES_AT   = 'confirmation_expires_at';
    public const string ATTR_CONFIRMED_AT              = 'confirmed_at';
    public const string ATTR_UNSUBSCRIBED_AT           = 'unsubscribed_at';
    public const string ATTR_UNSUBSCRIBE_REASON        = 'unsubscribe_reason';
    public const string ATTR_BOUNCE_KIND               = 'bounce_kind';
    public const string ATTR_BOUNCED_AT                = 'bounced_at';
    public const string ATTR_COMPLAINED_AT             = 'complained_at';
    public const string ATTR_CONSENT_EVIDENCE          = 'consent_evidence';
    public const string ATTR_IP_ADDRESS                = 'ip_address';
    public const string ATTR_USER_AGENT                = 'user_agent';
    public const string ATTR_SUBSCRIBED_AT             = 'subscribed_at';
    public const string ATTR_LAST_OPENED_AT            = 'last_opened_at';
    public const string ATTR_LAST_CLICKED_AT           = 'last_clicked_at';
    public const string ATTR_ENGAGEMENT_SCORE          = 'engagement_score';
    public const string ATTR_METADATA                  = 'metadata';
    public const string ATTR_CREATED_BY                = 'created_by';
    public const string ATTR_UPDATED_BY                = 'updated_by';
    public const string ATTR_DELETED_BY                = 'deleted_by';
    public const string ATTR_CREATED_AT                = 'created_at';
    public const string ATTR_UPDATED_AT                = 'updated_at';
    public const string ATTR_DELETED_AT                = 'deleted_at';
}
