<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Events;

use Stackra\Events\Attributes\AsEvent;
use DateTimeInterface;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when an issue transitions to scheduled + the matching
 * campaign is created.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'newsletter.issue.scheduled')]
final readonly class NewsletterIssueScheduled implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $issueId,
        public string $campaignId,
        public DateTimeInterface $scheduledAt,
    ) {
    }
}
