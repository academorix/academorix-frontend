<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Newsletter\Contracts\Data\NewsletterInterface;
use Stackra\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Stackra\Newsletter\Database\Factories\NewsletterSubscriptionFactory;
use Stackra\Newsletter\Enums\NewsletterSubscriptionStatus;
use Stackra\Newsletter\Observers\NewsletterSubscriptionObserver;
use Stackra\Newsletter\Policies\NewsletterSubscriptionPolicy;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
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
 * {@see NewsletterSubscriptionInterface}.
 *
 * Composes `BelongsToTenant` so every read/write auto-scopes. The
 * confirmation + unsubscribe tokens are `#[Hidden]` — NEVER
 * returned by wire responses. `consent_evidence`, `ip_address`, and
 * `user_agent` are confidential PII carried for CAN-SPAM + CASL
 * evidence.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Table(
    name: NewsletterSubscriptionInterface::TABLE,
    key: NewsletterSubscriptionInterface::PRIMARY_KEY,
    keyType: NewsletterSubscriptionInterface::KEY_TYPE,
)]
#[Fillable([
    NewsletterSubscriptionInterface::ATTR_TENANT_ID,
    NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID,
    NewsletterSubscriptionInterface::ATTR_USER_ID,
    NewsletterSubscriptionInterface::ATTR_EMAIL,
    NewsletterSubscriptionInterface::ATTR_FIRST_NAME,
    NewsletterSubscriptionInterface::ATTR_LAST_NAME,
    NewsletterSubscriptionInterface::ATTR_LOCALE,
    NewsletterSubscriptionInterface::ATTR_STATUS,
    NewsletterSubscriptionInterface::ATTR_SOURCE,
    NewsletterSubscriptionInterface::ATTR_TAGS,
    NewsletterSubscriptionInterface::ATTR_CONFIRMATION_TOKEN,
    NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBE_TOKEN,
    NewsletterSubscriptionInterface::ATTR_CONFIRMATION_EXPIRES_AT,
    NewsletterSubscriptionInterface::ATTR_CONFIRMED_AT,
    NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBED_AT,
    NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBE_REASON,
    NewsletterSubscriptionInterface::ATTR_BOUNCE_KIND,
    NewsletterSubscriptionInterface::ATTR_BOUNCED_AT,
    NewsletterSubscriptionInterface::ATTR_COMPLAINED_AT,
    NewsletterSubscriptionInterface::ATTR_CONSENT_EVIDENCE,
    NewsletterSubscriptionInterface::ATTR_IP_ADDRESS,
    NewsletterSubscriptionInterface::ATTR_USER_AGENT,
    NewsletterSubscriptionInterface::ATTR_SUBSCRIBED_AT,
    NewsletterSubscriptionInterface::ATTR_LAST_OPENED_AT,
    NewsletterSubscriptionInterface::ATTR_LAST_CLICKED_AT,
    NewsletterSubscriptionInterface::ATTR_ENGAGEMENT_SCORE,
    NewsletterSubscriptionInterface::ATTR_METADATA,
])]
#[Hidden([
    NewsletterSubscriptionInterface::ATTR_CONFIRMATION_TOKEN,
    NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBE_TOKEN,
])]
#[UseFactory(NewsletterSubscriptionFactory::class)]
#[UsePolicy(NewsletterSubscriptionPolicy::class)]
#[ObservedBy([NewsletterSubscriptionObserver::class])]
#[WithoutIncrementing]
final class NewsletterSubscription extends Model implements AuditableContract, NewsletterSubscriptionInterface
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
        NewsletterSubscriptionInterface::ATTR_STATUS                  => NewsletterSubscriptionStatus::class,
        NewsletterSubscriptionInterface::ATTR_TAGS                    => 'array',
        NewsletterSubscriptionInterface::ATTR_CONSENT_EVIDENCE        => 'array',
        NewsletterSubscriptionInterface::ATTR_CONFIRMATION_EXPIRES_AT => 'datetime',
        NewsletterSubscriptionInterface::ATTR_CONFIRMED_AT            => 'datetime',
        NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBED_AT         => 'datetime',
        NewsletterSubscriptionInterface::ATTR_BOUNCED_AT              => 'datetime',
        NewsletterSubscriptionInterface::ATTR_COMPLAINED_AT           => 'datetime',
        NewsletterSubscriptionInterface::ATTR_SUBSCRIBED_AT           => 'datetime',
        NewsletterSubscriptionInterface::ATTR_LAST_OPENED_AT          => 'datetime',
        NewsletterSubscriptionInterface::ATTR_LAST_CLICKED_AT         => 'datetime',
        NewsletterSubscriptionInterface::ATTR_ENGAGEMENT_SCORE        => 'integer',
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
            NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID,
            NewsletterInterface::ATTR_ID,
        );
    }

    /**
     * Whether the row is currently deliverable.
     */
    public function isActive(): bool
    {
        $status = $this->{NewsletterSubscriptionInterface::ATTR_STATUS};

        return $status === NewsletterSubscriptionStatus::Active
            || $status === NewsletterSubscriptionStatus::Active->value;
    }
}
