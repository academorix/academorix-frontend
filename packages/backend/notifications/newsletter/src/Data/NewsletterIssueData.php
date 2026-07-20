<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Data;

use Academorix\Newsletter\Contracts\Data\NewsletterIssueInterface;
use Academorix\Newsletter\Enums\NewsletterIssueStatus;
use Academorix\Newsletter\Models\NewsletterIssue;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Output DTO for {@see NewsletterIssue}.
 *
 * `content_blocks` + `variables` are internal but wire-visible on
 * the admin surface — tenant admins need them to edit + preview.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class NewsletterIssueData extends Data
{
    /**
     * @param  list<array<string, mixed>>|null  $contentBlocks
     * @param  array<string, mixed>|null        $variables
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $newsletterId,
        public string $subject,
        public NewsletterIssueStatus $status,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        public ?string $slug = null,
        public ?int $issueNumber = null,
        public ?string $preheader = null,
        public ?array $contentBlocks = null,
        public ?array $variables = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $scheduledAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $sentAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $cancelledAt = null,
        public ?string $cancelReason = null,
    ) {
    }

    /**
     * Build from a Model.
     */
    public static function fromModel(NewsletterIssue $issue): self
    {
        $rawStatus = $issue->{NewsletterIssueInterface::ATTR_STATUS};
        $status    = $rawStatus instanceof NewsletterIssueStatus
            ? $rawStatus
            : (NewsletterIssueStatus::tryFrom((string) $rawStatus) ?? NewsletterIssueStatus::Draft);

        return new self(
            id: (string) $issue->getKey(),
            tenantId: (string) $issue->{NewsletterIssueInterface::ATTR_TENANT_ID},
            newsletterId: (string) $issue->{NewsletterIssueInterface::ATTR_NEWSLETTER_ID},
            subject: (string) $issue->{NewsletterIssueInterface::ATTR_SUBJECT},
            status: $status,
            createdAt: $issue->{NewsletterIssueInterface::ATTR_CREATED_AT},
            updatedAt: $issue->{NewsletterIssueInterface::ATTR_UPDATED_AT},
            slug: $issue->{NewsletterIssueInterface::ATTR_SLUG},
            issueNumber: $issue->{NewsletterIssueInterface::ATTR_ISSUE_NUMBER} !== null
                ? (int) $issue->{NewsletterIssueInterface::ATTR_ISSUE_NUMBER}
                : null,
            preheader: $issue->{NewsletterIssueInterface::ATTR_PREHEADER},
            contentBlocks: \is_array($issue->{NewsletterIssueInterface::ATTR_CONTENT_BLOCKS})
                ? $issue->{NewsletterIssueInterface::ATTR_CONTENT_BLOCKS}
                : null,
            variables: \is_array($issue->{NewsletterIssueInterface::ATTR_VARIABLES})
                ? $issue->{NewsletterIssueInterface::ATTR_VARIABLES}
                : null,
            scheduledAt: $issue->{NewsletterIssueInterface::ATTR_SCHEDULED_AT},
            sentAt: $issue->{NewsletterIssueInterface::ATTR_SENT_AT},
            cancelledAt: $issue->{NewsletterIssueInterface::ATTR_CANCELLED_AT},
            cancelReason: $issue->{NewsletterIssueInterface::ATTR_CANCEL_REASON},
        );
    }
}
