<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Contracts\Data;

use Academorix\Newsletter\Models\NewsletterIssue;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `newsletter_issues` table.
 *
 * One issue of a newsletter. Carries the editorial content
 * (`content_blocks` + `variables`), the subject line, the scheduled
 * send timestamp, and the lifecycle state. Immutable after `sent` —
 * the row becomes historical evidence of what was actually delivered.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Bind(NewsletterIssue::class)]
interface NewsletterIssueInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'newsletter_issues';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key type — string, prefixed ULID.
     */
    public const string KEY_TYPE = 'string';

    /**
     * ULID prefix — every generated id lands as `nli_<ulid>`.
     */
    public const string ID_PREFIX = 'nli';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID              = 'id';
    public const string ATTR_TENANT_ID       = 'tenant_id';
    public const string ATTR_NEWSLETTER_ID   = 'newsletter_id';
    public const string ATTR_SLUG            = 'slug';
    public const string ATTR_ISSUE_NUMBER    = 'issue_number';
    public const string ATTR_SUBJECT         = 'subject';
    public const string ATTR_PREHEADER       = 'preheader';
    public const string ATTR_CONTENT_BLOCKS  = 'content_blocks';
    public const string ATTR_VARIABLES       = 'variables';
    public const string ATTR_STATUS          = 'status';
    public const string ATTR_SCHEDULED_AT    = 'scheduled_at';
    public const string ATTR_SENT_AT         = 'sent_at';
    public const string ATTR_CANCELLED_AT    = 'cancelled_at';
    public const string ATTR_CANCEL_REASON   = 'cancel_reason';
    public const string ATTR_METADATA        = 'metadata';
    public const string ATTR_CREATED_BY      = 'created_by';
    public const string ATTR_UPDATED_BY      = 'updated_by';
    public const string ATTR_DELETED_BY      = 'deleted_by';
    public const string ATTR_CREATED_AT      = 'created_at';
    public const string ATTR_UPDATED_AT      = 'updated_at';
    public const string ATTR_DELETED_AT      = 'deleted_at';
}
