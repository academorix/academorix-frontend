<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Data;

use Stackra\Newsletter\Contracts\Data\NewsletterInterface;
use Stackra\Newsletter\Enums\NewsletterCadence;
use Stackra\Newsletter\Enums\NewsletterStatus;
use Stackra\Newsletter\Models\Newsletter;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Output DTO for {@see Newsletter}.
 *
 * Never carries sender-config secrets — those live on the model
 * behind `#[Hidden]` on future refactors. `brand` is public
 * branding metadata (logo URL, colours).
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class NewsletterData extends Data
{
    /**
     * @param  array<string, mixed>|null  $senderConfig
     * @param  array<string, mixed>|null  $brand
     * @param  array<string, mixed>|null  $reputationThresholds
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $slug,
        public string $name,
        public NewsletterCadence $cadence,
        public NewsletterStatus $status,
        public bool $confirmationRequired,
        public int $lastIssueNumber,
        public int $reputationBreachStreak,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        public ?string $description = null,
        public ?array $senderConfig = null,
        public ?array $brand = null,
        public ?array $reputationThresholds = null,
    ) {
    }

    /**
     * Build from a Model.
     */
    public static function fromModel(Newsletter $newsletter): self
    {
        $rawStatus = $newsletter->{NewsletterInterface::ATTR_STATUS};
        $status    = $rawStatus instanceof NewsletterStatus
            ? $rawStatus
            : (NewsletterStatus::tryFrom((string) $rawStatus) ?? NewsletterStatus::Draft);

        $rawCadence = $newsletter->{NewsletterInterface::ATTR_CADENCE};
        $cadence    = $rawCadence instanceof NewsletterCadence
            ? $rawCadence
            : (NewsletterCadence::tryFrom((string) $rawCadence) ?? NewsletterCadence::Manual);

        return new self(
            id: (string) $newsletter->getKey(),
            tenantId: (string) $newsletter->{NewsletterInterface::ATTR_TENANT_ID},
            slug: (string) $newsletter->{NewsletterInterface::ATTR_SLUG},
            name: (string) $newsletter->{NewsletterInterface::ATTR_NAME},
            cadence: $cadence,
            status: $status,
            confirmationRequired: (bool) $newsletter->{NewsletterInterface::ATTR_CONFIRMATION_REQUIRED},
            lastIssueNumber: (int) $newsletter->{NewsletterInterface::ATTR_LAST_ISSUE_NUMBER},
            reputationBreachStreak: (int) $newsletter->{NewsletterInterface::ATTR_REPUTATION_BREACH_STREAK},
            createdAt: $newsletter->{NewsletterInterface::ATTR_CREATED_AT},
            updatedAt: $newsletter->{NewsletterInterface::ATTR_UPDATED_AT},
            description: $newsletter->{NewsletterInterface::ATTR_DESCRIPTION},
            senderConfig: \is_array($newsletter->{NewsletterInterface::ATTR_SENDER_CONFIG})
                ? $newsletter->{NewsletterInterface::ATTR_SENDER_CONFIG}
                : null,
            brand: \is_array($newsletter->{NewsletterInterface::ATTR_BRAND})
                ? $newsletter->{NewsletterInterface::ATTR_BRAND}
                : null,
            reputationThresholds: \is_array($newsletter->{NewsletterInterface::ATTR_REPUTATION_THRESHOLDS})
                ? $newsletter->{NewsletterInterface::ATTR_REPUTATION_THRESHOLDS}
                : null,
        );
    }
}
