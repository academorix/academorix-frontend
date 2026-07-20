<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Models;

use Academorix\Database\Concerns\HasMetadata;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Newsletter\Contracts\Data\NewsletterInterface;
use Academorix\Newsletter\Database\Factories\NewsletterFactory;
use Academorix\Newsletter\Enums\NewsletterCadence;
use Academorix\Newsletter\Enums\NewsletterStatus;
use Academorix\Newsletter\Observers\NewsletterObserver;
use Academorix\Newsletter\Policies\NewsletterPolicy;
use Academorix\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see NewsletterInterface}.
 *
 * One editorial publication owned by a tenant. Composes
 * `BelongsToTenant` so every read/write auto-scopes to the active
 * tenant. Sender config + brand JSON hold denormalised copies of
 * the publication's "from" identity + colours; a future refactor
 * may promote these to first-class rows.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Table(
    name: NewsletterInterface::TABLE,
    key: NewsletterInterface::PRIMARY_KEY,
    keyType: NewsletterInterface::KEY_TYPE,
)]
#[Fillable([
    NewsletterInterface::ATTR_TENANT_ID,
    NewsletterInterface::ATTR_SLUG,
    NewsletterInterface::ATTR_NAME,
    NewsletterInterface::ATTR_DESCRIPTION,
    NewsletterInterface::ATTR_CADENCE,
    NewsletterInterface::ATTR_STATUS,
    NewsletterInterface::ATTR_CONFIRMATION_REQUIRED,
    NewsletterInterface::ATTR_SENDER_CONFIG,
    NewsletterInterface::ATTR_BRAND,
    NewsletterInterface::ATTR_REPUTATION_THRESHOLDS,
    NewsletterInterface::ATTR_REPUTATION_BREACH_STREAK,
    NewsletterInterface::ATTR_LAST_ISSUE_NUMBER,
    NewsletterInterface::ATTR_METADATA,
])]
#[UseFactory(NewsletterFactory::class)]
#[UsePolicy(NewsletterPolicy::class)]
#[ObservedBy([NewsletterObserver::class])]
#[WithoutIncrementing]
final class Newsletter extends Model implements AuditableContract, NewsletterInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums + JSON + booleans coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        NewsletterInterface::ATTR_CADENCE                  => NewsletterCadence::class,
        NewsletterInterface::ATTR_STATUS                   => NewsletterStatus::class,
        NewsletterInterface::ATTR_CONFIRMATION_REQUIRED    => 'boolean',
        NewsletterInterface::ATTR_SENDER_CONFIG            => 'array',
        NewsletterInterface::ATTR_BRAND                    => 'array',
        NewsletterInterface::ATTR_REPUTATION_THRESHOLDS    => 'array',
        NewsletterInterface::ATTR_REPUTATION_BREACH_STREAK => 'integer',
        NewsletterInterface::ATTR_LAST_ISSUE_NUMBER        => 'integer',
    ];

    /**
     * Issues published (or drafted) under this newsletter.
     *
     * @return HasMany<NewsletterIssue, $this>
     */
    public function issues(): HasMany
    {
        return $this->hasMany(
            NewsletterIssue::class,
            \Academorix\Newsletter\Contracts\Data\NewsletterIssueInterface::ATTR_NEWSLETTER_ID,
            NewsletterInterface::ATTR_ID,
        );
    }

    /**
     * Subscriptions attached to this newsletter.
     *
     * @return HasMany<NewsletterSubscription, $this>
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(
            NewsletterSubscription::class,
            \Academorix\Newsletter\Contracts\Data\NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID,
            NewsletterInterface::ATTR_ID,
        );
    }

    /**
     * Campaigns dispatched for this newsletter.
     *
     * @return HasMany<NewsletterCampaign, $this>
     */
    public function campaigns(): HasMany
    {
        return $this->hasMany(
            NewsletterCampaign::class,
            \Academorix\Newsletter\Contracts\Data\NewsletterCampaignInterface::ATTR_NEWSLETTER_ID,
            NewsletterInterface::ATTR_ID,
        );
    }

    /**
     * Audience segments defined for this newsletter.
     *
     * @return HasMany<NewsletterAudience, $this>
     */
    public function audiences(): HasMany
    {
        return $this->hasMany(
            NewsletterAudience::class,
            \Academorix\Newsletter\Contracts\Data\NewsletterAudienceInterface::ATTR_NEWSLETTER_ID,
            NewsletterInterface::ATTR_ID,
        );
    }

    /**
     * Whether this newsletter is available to accept new campaigns.
     *
     * `Draft`, `Paused`, `Throttled`, and `Archived` newsletters
     * refuse new campaign scheduling.
     */
    public function isActive(): bool
    {
        $status = $this->{NewsletterInterface::ATTR_STATUS};

        return $status === NewsletterStatus::Active
            || $status === NewsletterStatus::Active->value;
    }
}
