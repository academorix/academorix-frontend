<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Contracts\Data;

use Academorix\Newsletter\Models\NewsletterCampaign;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `newsletter_campaigns` table.
 *
 * A single send event — pins one issue to one audience at one
 * scheduled time. `counters` is the running JSON aggregate
 * (`targeted`, `sent`, `opened`, `clicked`, `bounced`, `complained`,
 * `unsubscribed`, `suppressed`, `opted_out`), incremented atomically
 * by the batch send jobs.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Bind(NewsletterCampaign::class)]
interface NewsletterCampaignInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'newsletter_campaigns';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key type — string, prefixed ULID.
     */
    public const string KEY_TYPE = 'string';

    /**
     * ULID prefix — every generated id lands as `nlc_<ulid>`.
     */
    public const string ID_PREFIX = 'nlc';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                    = 'id';
    public const string ATTR_TENANT_ID             = 'tenant_id';
    public const string ATTR_NEWSLETTER_ID         = 'newsletter_id';
    public const string ATTR_ISSUE_ID              = 'issue_id';
    public const string ATTR_AUDIENCE_ID           = 'audience_id';
    public const string ATTR_STATUS                = 'status';
    public const string ATTR_SCHEDULED_AT          = 'scheduled_at';
    public const string ATTR_STARTED_AT            = 'started_at';
    public const string ATTR_COMPLETED_AT          = 'completed_at';
    public const string ATTR_CANCELLED_AT          = 'cancelled_at';
    public const string ATTR_FAILURE_REASON        = 'failure_reason';
    public const string ATTR_SEND_BATCH_SIZE       = 'send_batch_size';
    public const string ATTR_THROTTLE_PER_SECOND   = 'throttle_per_second';
    public const string ATTR_COUNTERS              = 'counters';
    public const string ATTR_METADATA              = 'metadata';
    public const string ATTR_CREATED_BY            = 'created_by';
    public const string ATTR_UPDATED_BY            = 'updated_by';
    public const string ATTR_DELETED_BY            = 'deleted_by';
    public const string ATTR_CREATED_AT            = 'created_at';
    public const string ATTR_UPDATED_AT            = 'updated_at';
    public const string ATTR_DELETED_AT            = 'deleted_at';
}
