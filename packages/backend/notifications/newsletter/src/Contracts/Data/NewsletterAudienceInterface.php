<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Contracts\Data;

use Stackra\Newsletter\Models\NewsletterAudience;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `newsletter_audiences` table.
 *
 * An audience segment definition scoped to a single newsletter.
 * `expression` is a rule-based selector evaluated by
 * {@see \Stackra\Newsletter\Contracts\Services\AudienceEvaluatorInterface}
 * against active subscriptions. `cached_subscriber_ids` holds the
 * pre-evaluated list produced by
 * {@see \Stackra\Newsletter\Jobs\BuildAudienceSegmentJob} — read
 * by the campaign orchestrator on send.
 *
 * The `is_default` audience is a system row every newsletter
 * receives on creation; it matches every active subscription and
 * cannot be deleted.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Bind(NewsletterAudience::class)]
interface NewsletterAudienceInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'newsletter_audiences';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key type — string, prefixed ULID.
     */
    public const string KEY_TYPE = 'string';

    /**
     * ULID prefix — every generated id lands as `nla_<ulid>`.
     */
    public const string ID_PREFIX = 'nla';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                       = 'id';
    public const string ATTR_TENANT_ID                = 'tenant_id';
    public const string ATTR_NEWSLETTER_ID            = 'newsletter_id';
    public const string ATTR_SLUG                     = 'slug';
    public const string ATTR_NAME                     = 'name';
    public const string ATTR_DESCRIPTION              = 'description';
    public const string ATTR_EXPRESSION               = 'expression';
    public const string ATTR_IS_DEFAULT               = 'is_default';
    public const string ATTR_CACHED_SUBSCRIBER_IDS    = 'cached_subscriber_ids';
    public const string ATTR_CACHED_SUBSCRIBER_COUNT  = 'cached_subscriber_count';
    public const string ATTR_CACHE_REFRESHED_AT       = 'cache_refreshed_at';
    public const string ATTR_METADATA                 = 'metadata';
    public const string ATTR_CREATED_BY               = 'created_by';
    public const string ATTR_UPDATED_BY               = 'updated_by';
    public const string ATTR_DELETED_BY               = 'deleted_by';
    public const string ATTR_CREATED_AT               = 'created_at';
    public const string ATTR_UPDATED_AT               = 'updated_at';
    public const string ATTR_DELETED_AT               = 'deleted_at';
}
