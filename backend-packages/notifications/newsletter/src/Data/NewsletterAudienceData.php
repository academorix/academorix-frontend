<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Data;

use Academorix\Newsletter\Contracts\Data\NewsletterAudienceInterface;
use Academorix\Newsletter\Models\NewsletterAudience;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Output DTO for {@see NewsletterAudience}.
 *
 * Never carries the full `cached_subscriber_ids` list on the wire —
 * that field can grow to hundreds of thousands of ids. Only the
 * count is exposed so admin surfaces render the segment size.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class NewsletterAudienceData extends Data
{
    /**
     * @param  array<string, mixed>|null  $expression
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $newsletterId,
        public string $slug,
        public string $name,
        public bool $isDefault,
        public int $cachedSubscriberCount,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        public ?string $description = null,
        public ?array $expression = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $cacheRefreshedAt = null,
    ) {
    }

    /**
     * Build from a Model.
     */
    public static function fromModel(NewsletterAudience $audience): self
    {
        return new self(
            id: (string) $audience->getKey(),
            tenantId: (string) $audience->{NewsletterAudienceInterface::ATTR_TENANT_ID},
            newsletterId: (string) $audience->{NewsletterAudienceInterface::ATTR_NEWSLETTER_ID},
            slug: (string) $audience->{NewsletterAudienceInterface::ATTR_SLUG},
            name: (string) $audience->{NewsletterAudienceInterface::ATTR_NAME},
            isDefault: (bool) $audience->{NewsletterAudienceInterface::ATTR_IS_DEFAULT},
            cachedSubscriberCount: (int) $audience->{NewsletterAudienceInterface::ATTR_CACHED_SUBSCRIBER_COUNT},
            createdAt: $audience->{NewsletterAudienceInterface::ATTR_CREATED_AT},
            updatedAt: $audience->{NewsletterAudienceInterface::ATTR_UPDATED_AT},
            description: $audience->{NewsletterAudienceInterface::ATTR_DESCRIPTION},
            expression: \is_array($audience->{NewsletterAudienceInterface::ATTR_EXPRESSION})
                ? $audience->{NewsletterAudienceInterface::ATTR_EXPRESSION}
                : null,
            cacheRefreshedAt: $audience->{NewsletterAudienceInterface::ATTR_CACHE_REFRESHED_AT},
        );
    }
}
