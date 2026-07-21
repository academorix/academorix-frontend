<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Data;

use Stackra\Newsletter\Contracts\Data\NewsletterCampaignInterface;
use Stackra\Newsletter\Enums\NewsletterCampaignStatus;
use Stackra\Newsletter\Models\NewsletterCampaign;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Output DTO for {@see NewsletterCampaign}.
 *
 * `counters` is a plain map — the exact keys depend on the reporter
 * side; consumers treat unknown keys as zero.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class NewsletterCampaignData extends Data
{
    /**
     * @param  array<string, mixed>  $counters
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $newsletterId,
        public string $issueId,
        public string $audienceId,
        public NewsletterCampaignStatus $status,
        public array $counters,
        public int $sendBatchSize,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $scheduledAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        public ?int $throttlePerSecond = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $startedAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $completedAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $cancelledAt = null,
        public ?string $failureReason = null,
    ) {
    }

    /**
     * Build from a Model.
     */
    public static function fromModel(NewsletterCampaign $campaign): self
    {
        $rawStatus = $campaign->{NewsletterCampaignInterface::ATTR_STATUS};
        $status    = $rawStatus instanceof NewsletterCampaignStatus
            ? $rawStatus
            : (NewsletterCampaignStatus::tryFrom((string) $rawStatus) ?? NewsletterCampaignStatus::Pending);

        return new self(
            id: (string) $campaign->getKey(),
            tenantId: (string) $campaign->{NewsletterCampaignInterface::ATTR_TENANT_ID},
            newsletterId: (string) $campaign->{NewsletterCampaignInterface::ATTR_NEWSLETTER_ID},
            issueId: (string) $campaign->{NewsletterCampaignInterface::ATTR_ISSUE_ID},
            audienceId: (string) $campaign->{NewsletterCampaignInterface::ATTR_AUDIENCE_ID},
            status: $status,
            counters: \is_array($campaign->{NewsletterCampaignInterface::ATTR_COUNTERS})
                ? $campaign->{NewsletterCampaignInterface::ATTR_COUNTERS}
                : [],
            sendBatchSize: (int) $campaign->{NewsletterCampaignInterface::ATTR_SEND_BATCH_SIZE},
            scheduledAt: $campaign->{NewsletterCampaignInterface::ATTR_SCHEDULED_AT},
            createdAt: $campaign->{NewsletterCampaignInterface::ATTR_CREATED_AT},
            updatedAt: $campaign->{NewsletterCampaignInterface::ATTR_UPDATED_AT},
            throttlePerSecond: $campaign->{NewsletterCampaignInterface::ATTR_THROTTLE_PER_SECOND} !== null
                ? (int) $campaign->{NewsletterCampaignInterface::ATTR_THROTTLE_PER_SECOND}
                : null,
            startedAt: $campaign->{NewsletterCampaignInterface::ATTR_STARTED_AT},
            completedAt: $campaign->{NewsletterCampaignInterface::ATTR_COMPLETED_AT},
            cancelledAt: $campaign->{NewsletterCampaignInterface::ATTR_CANCELLED_AT},
            failureReason: $campaign->{NewsletterCampaignInterface::ATTR_FAILURE_REASON},
        );
    }
}
