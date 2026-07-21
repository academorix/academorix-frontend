<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Data;

use Stackra\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Stackra\Newsletter\Enums\NewsletterSubscriptionStatus;
use Stackra\Newsletter\Models\NewsletterSubscription;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Output DTO for {@see NewsletterSubscription}.
 *
 * NEVER carries `confirmation_token` or `unsubscribe_token` — those
 * are model-level `#[Hidden]` AND omitted here as belt-and-braces.
 * Consent evidence is tenant-admin visible (regulatory review), IP +
 * user agent are tenant-admin visible for the same reason.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class NewsletterSubscriptionData extends Data
{
    /**
     * @param  list<string>|null          $tags
     * @param  array<string, mixed>|null  $consentEvidence
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $newsletterId,
        public string $email,
        public NewsletterSubscriptionStatus $status,
        public string $source,
        public int $engagementScore,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        public ?string $userId = null,
        public ?string $firstName = null,
        public ?string $lastName = null,
        public ?string $locale = null,
        public ?array $tags = null,
        public ?array $consentEvidence = null,
        public ?string $ipAddress = null,
        public ?string $userAgent = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $subscribedAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $confirmedAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $unsubscribedAt = null,
        public ?string $unsubscribeReason = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $lastOpenedAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $lastClickedAt = null,
    ) {
    }

    /**
     * Build from a Model.
     */
    public static function fromModel(NewsletterSubscription $subscription): self
    {
        $rawStatus = $subscription->{NewsletterSubscriptionInterface::ATTR_STATUS};
        $status    = $rawStatus instanceof NewsletterSubscriptionStatus
            ? $rawStatus
            : (NewsletterSubscriptionStatus::tryFrom((string) $rawStatus) ?? NewsletterSubscriptionStatus::PendingConfirmation);

        return new self(
            id: (string) $subscription->getKey(),
            tenantId: (string) $subscription->{NewsletterSubscriptionInterface::ATTR_TENANT_ID},
            newsletterId: (string) $subscription->{NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID},
            email: (string) $subscription->{NewsletterSubscriptionInterface::ATTR_EMAIL},
            status: $status,
            source: (string) $subscription->{NewsletterSubscriptionInterface::ATTR_SOURCE},
            engagementScore: (int) $subscription->{NewsletterSubscriptionInterface::ATTR_ENGAGEMENT_SCORE},
            createdAt: $subscription->{NewsletterSubscriptionInterface::ATTR_CREATED_AT},
            updatedAt: $subscription->{NewsletterSubscriptionInterface::ATTR_UPDATED_AT},
            userId: $subscription->{NewsletterSubscriptionInterface::ATTR_USER_ID} !== null
                ? (string) $subscription->{NewsletterSubscriptionInterface::ATTR_USER_ID}
                : null,
            firstName: $subscription->{NewsletterSubscriptionInterface::ATTR_FIRST_NAME},
            lastName: $subscription->{NewsletterSubscriptionInterface::ATTR_LAST_NAME},
            locale: $subscription->{NewsletterSubscriptionInterface::ATTR_LOCALE},
            tags: \is_array($subscription->{NewsletterSubscriptionInterface::ATTR_TAGS})
                ? \array_values($subscription->{NewsletterSubscriptionInterface::ATTR_TAGS})
                : null,
            consentEvidence: \is_array($subscription->{NewsletterSubscriptionInterface::ATTR_CONSENT_EVIDENCE})
                ? $subscription->{NewsletterSubscriptionInterface::ATTR_CONSENT_EVIDENCE}
                : null,
            ipAddress: $subscription->{NewsletterSubscriptionInterface::ATTR_IP_ADDRESS},
            userAgent: $subscription->{NewsletterSubscriptionInterface::ATTR_USER_AGENT},
            subscribedAt: $subscription->{NewsletterSubscriptionInterface::ATTR_SUBSCRIBED_AT},
            confirmedAt: $subscription->{NewsletterSubscriptionInterface::ATTR_CONFIRMED_AT},
            unsubscribedAt: $subscription->{NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBED_AT},
            unsubscribeReason: $subscription->{NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBE_REASON},
            lastOpenedAt: $subscription->{NewsletterSubscriptionInterface::ATTR_LAST_OPENED_AT},
            lastClickedAt: $subscription->{NewsletterSubscriptionInterface::ATTR_LAST_CLICKED_AT},
        );
    }
}
