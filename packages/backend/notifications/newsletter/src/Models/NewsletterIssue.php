<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Newsletter\Contracts\Data\NewsletterCampaignInterface;
use Stackra\Newsletter\Contracts\Data\NewsletterInterface;
use Stackra\Newsletter\Contracts\Data\NewsletterIssueInterface;
use Stackra\Newsletter\Database\Factories\NewsletterIssueFactory;
use Stackra\Newsletter\Enums\NewsletterIssueStatus;
use Stackra\Newsletter\Observers\NewsletterIssueObserver;
use Stackra\Newsletter\Policies\NewsletterIssuePolicy;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Wildside\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see NewsletterIssueInterface}.
 *
 * One issue of a newsletter. `content_blocks` is the ordered list of
 * body sections the mail renderer walks; `variables` is the free-
 * form template variable map merged during render. Once `status =
 * Sent`, the row is historical evidence and NEVER editable.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Table(
    name: NewsletterIssueInterface::TABLE,
    key: NewsletterIssueInterface::PRIMARY_KEY,
    keyType: NewsletterIssueInterface::KEY_TYPE,
)]
#[Fillable([
    NewsletterIssueInterface::ATTR_TENANT_ID,
    NewsletterIssueInterface::ATTR_NEWSLETTER_ID,
    NewsletterIssueInterface::ATTR_SLUG,
    NewsletterIssueInterface::ATTR_ISSUE_NUMBER,
    NewsletterIssueInterface::ATTR_SUBJECT,
    NewsletterIssueInterface::ATTR_PREHEADER,
    NewsletterIssueInterface::ATTR_CONTENT_BLOCKS,
    NewsletterIssueInterface::ATTR_VARIABLES,
    NewsletterIssueInterface::ATTR_STATUS,
    NewsletterIssueInterface::ATTR_SCHEDULED_AT,
    NewsletterIssueInterface::ATTR_SENT_AT,
    NewsletterIssueInterface::ATTR_CANCELLED_AT,
    NewsletterIssueInterface::ATTR_CANCEL_REASON,
    NewsletterIssueInterface::ATTR_METADATA,
])]
#[UseFactory(NewsletterIssueFactory::class)]
#[UsePolicy(NewsletterIssuePolicy::class)]
#[ObservedBy([NewsletterIssueObserver::class])]
#[WithoutIncrementing]
final class NewsletterIssue extends Model implements AuditableContract, NewsletterIssueInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — status enum + JSON + datetimes coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        NewsletterIssueInterface::ATTR_STATUS         => NewsletterIssueStatus::class,
        NewsletterIssueInterface::ATTR_CONTENT_BLOCKS => 'array',
        NewsletterIssueInterface::ATTR_VARIABLES      => 'array',
        NewsletterIssueInterface::ATTR_SCHEDULED_AT   => 'datetime',
        NewsletterIssueInterface::ATTR_SENT_AT        => 'datetime',
        NewsletterIssueInterface::ATTR_CANCELLED_AT   => 'datetime',
        NewsletterIssueInterface::ATTR_ISSUE_NUMBER   => 'integer',
    ];

    /**
     * Parent newsletter.
     *
     * @return BelongsTo<Newsletter, $this>
     */
    public function newsletter(): BelongsTo
    {
        return $this->belongsTo(
            Newsletter::class,
            NewsletterIssueInterface::ATTR_NEWSLETTER_ID,
            NewsletterInterface::ATTR_ID,
        );
    }

    /**
     * Campaigns dispatched for this issue. One issue is typically
     * one campaign; the schema tolerates re-scheduling via a second
     * campaign row for the same issue.
     *
     * @return HasMany<NewsletterCampaign, $this>
     */
    public function campaigns(): HasMany
    {
        return $this->hasMany(
            NewsletterCampaign::class,
            NewsletterCampaignInterface::ATTR_ISSUE_ID,
            NewsletterIssueInterface::ATTR_ID,
        );
    }

    /**
     * Whether the row is still editable.
     *
     * Issues in `Sending`, `Sent`, or `Cancelled` states are frozen.
     */
    public function isEditable(): bool
    {
        $status = $this->{NewsletterIssueInterface::ATTR_STATUS};

        return $status === NewsletterIssueStatus::Draft
            || $status === NewsletterIssueStatus::Draft->value
            || $status === NewsletterIssueStatus::Scheduled
            || $status === NewsletterIssueStatus::Scheduled->value;
    }
}
