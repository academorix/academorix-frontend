<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a new NewsletterIssue is drafted.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'newsletter.issue.drafted')]
final readonly class NewsletterIssueDrafted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $issueId,
        public string $newsletterId,
    ) {
    }
}
