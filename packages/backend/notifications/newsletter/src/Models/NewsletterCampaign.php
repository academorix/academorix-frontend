<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Newsletter\Contracts\Data\NewsletterAudienceInterface;
use Stackra\Newsletter\Contracts\Data\NewsletterCampaignInterface;
use Stackra\Newsletter\Contracts\Data\NewsletterInterface;
use Stackra\Newsletter\Contracts\Data\NewsletterIssueInterface;
use Stackra\Newsletter\Database\Factories\NewsletterCampaignFactory;
use Stackra\Newsletter\Enums\NewsletterCampaignStatus;
use Stackra\Newsletter\Observers\NewsletterCampaignObserver;
use Stackra\Newsletter\Policies\NewsletterCampaignPolicy;
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
use Illuminate\Database\Eloquent\SoftDeletes;
use Wildside\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a
 * {@see NewsletterCampaignInterface}.
 *
 * One send event pinned to one issue + one audience at one
 * scheduled time. `counters` is the running JSON aggregate the
 * batch send jobs increment atomically as they fan out — see the
 * campaign counters block in the blueprint's `data-classes.json`.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Table(
    name: NewsletterCampaignInterface::TABLE,
    key: NewsletterCampaignInterface::PRIMARY_KEY,
    keyType: NewsletterCampaignInterface::KEY_TYPE,
)]
#[Fillable([
    NewsletterCampaignInterface::ATTR_TENANT_ID,
    NewsletterCampaignInterface::ATTR_NEWSLETTER_ID,
    NewsletterCampaignInterface::ATTR_ISSUE_ID,
    NewsletterCampaignInterface::ATTR_AUDIENCE_ID,
    NewsletterCampaignInterface::ATTR_STATUS,
    NewsletterCampaignInterface::ATTR_SCHEDULED_AT,
    NewsletterCampaignInterface::ATTR_STARTED_AT,
    NewsletterCampaignInterface::ATTR_COMPLETED_AT,
    NewsletterCampaignInterface::ATTR_CANCELLED_AT,
    NewsletterCampaignInterface::ATTR_FAILURE_REASON,
    NewsletterCampaignInterface::ATTR_SEND_BATCH_SIZE,
    NewsletterCampaignInterface::ATTR_THROTTLE_PER_SECOND,
    NewsletterCampaignInterface::ATTR_COUNTERS,
    NewsletterCampaignInterface::ATTR_METADATA,
])]
#[UseFactory(NewsletterCampaignFactory::class)]
#[UsePolicy(NewsletterCampaignPolicy::class)]
#[ObservedBy([NewsletterCampaignObserver::class])]
#[WithoutIncrementing]
final class NewsletterCampaign extends Model implements AuditableContract, NewsletterCampaignInterface
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
        NewsletterCampaignInterface::ATTR_STATUS              => NewsletterCampaignStatus::class,
        NewsletterCampaignInterface::ATTR_COUNTERS            => 'array',
        NewsletterCampaignInterface::ATTR_SCHEDULED_AT        => 'datetime',
        NewsletterCampaignInterface::ATTR_STARTED_AT          => 'datetime',
        NewsletterCampaignInterface::ATTR_COMPLETED_AT        => 'datetime',
        NewsletterCampaignInterface::ATTR_CANCELLED_AT        => 'datetime',
        NewsletterCampaignInterface::ATTR_SEND_BATCH_SIZE     => 'integer',
        NewsletterCampaignInterface::ATTR_THROTTLE_PER_SECOND => 'integer',
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
            NewsletterCampaignInterface::ATTR_NEWSLETTER_ID,
            NewsletterInterface::ATTR_ID,
        );
    }

    /**
     * Linked issue.
     *
     * @return BelongsTo<NewsletterIssue, $this>
     */
    public function issue(): BelongsTo
    {
        return $this->belongsTo(
            NewsletterIssue::class,
            NewsletterCampaignInterface::ATTR_ISSUE_ID,
            NewsletterIssueInterface::ATTR_ID,
        );
    }

    /**
     * Target audience.
     *
     * @return BelongsTo<NewsletterAudience, $this>
     */
    public function audience(): BelongsTo
    {
        return $this->belongsTo(
            NewsletterAudience::class,
            NewsletterCampaignInterface::ATTR_AUDIENCE_ID,
            NewsletterAudienceInterface::ATTR_ID,
        );
    }
}
