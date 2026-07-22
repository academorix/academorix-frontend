<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Newsletter\Casts\AudienceExpressionCast;
use Stackra\Newsletter\Contracts\Data\NewsletterAudienceInterface;
use Stackra\Newsletter\Contracts\Data\NewsletterInterface;
use Stackra\Newsletter\Database\Factories\NewsletterAudienceFactory;
use Stackra\Newsletter\Observers\NewsletterAudienceObserver;
use Stackra\Newsletter\Policies\NewsletterAudiencePolicy;
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
 * {@see NewsletterAudienceInterface}.
 *
 * An audience segment definition. `expression` is the rule-based
 * JSON DSL; `cached_subscriber_ids` holds the pre-evaluated list
 * produced by the audience builder job.
 *
 * The default audience (`is_default = true`) is seeded on newsletter
 * creation and matches every active subscription — it is the
 * fallback audience when no explicit segmentation is required.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Table(
    name: NewsletterAudienceInterface::TABLE,
    key: NewsletterAudienceInterface::PRIMARY_KEY,
    keyType: NewsletterAudienceInterface::KEY_TYPE,
)]
#[Fillable([
    NewsletterAudienceInterface::ATTR_TENANT_ID,
    NewsletterAudienceInterface::ATTR_NEWSLETTER_ID,
    NewsletterAudienceInterface::ATTR_SLUG,
    NewsletterAudienceInterface::ATTR_NAME,
    NewsletterAudienceInterface::ATTR_DESCRIPTION,
    NewsletterAudienceInterface::ATTR_EXPRESSION,
    NewsletterAudienceInterface::ATTR_IS_DEFAULT,
    NewsletterAudienceInterface::ATTR_CACHED_SUBSCRIBER_IDS,
    NewsletterAudienceInterface::ATTR_CACHED_SUBSCRIBER_COUNT,
    NewsletterAudienceInterface::ATTR_CACHE_REFRESHED_AT,
    NewsletterAudienceInterface::ATTR_METADATA,
])]
#[UseFactory(NewsletterAudienceFactory::class)]
#[UsePolicy(NewsletterAudiencePolicy::class)]
#[ObservedBy([NewsletterAudienceObserver::class])]
#[WithoutIncrementing]
final class NewsletterAudience extends Model implements AuditableContract, NewsletterAudienceInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — expression cast + JSON + datetimes coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        NewsletterAudienceInterface::ATTR_EXPRESSION              => AudienceExpressionCast::class,
        NewsletterAudienceInterface::ATTR_IS_DEFAULT              => 'boolean',
        NewsletterAudienceInterface::ATTR_CACHED_SUBSCRIBER_IDS   => 'array',
        NewsletterAudienceInterface::ATTR_CACHED_SUBSCRIBER_COUNT => 'integer',
        NewsletterAudienceInterface::ATTR_CACHE_REFRESHED_AT      => 'datetime',
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
            NewsletterAudienceInterface::ATTR_NEWSLETTER_ID,
            NewsletterInterface::ATTR_ID,
        );
    }
}
