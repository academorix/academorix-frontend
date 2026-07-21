<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Events;

use Stackra\Events\Attributes\AsEvent;
use DateTimeInterface;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when an issue completes send — state transitions to
 * `sent` and the linked campaign is `completed`.
 *
 * ## Consumers
 *   - `newsletter::BroadcastPublishedIssue` — republishes the
 *     rendered issue to the archive endpoint (if enabled).
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'newsletter.issue.published')]
final readonly class NewsletterIssuePublished implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $issueId,
        public string $campaignId,
        public DateTimeInterface $sentAt,
    ) {
    }
}
