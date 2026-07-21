<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when an issue transitions to cancelled. The linked
 * campaign is cancelled alongside.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'newsletter.issue.cancelled')]
final readonly class NewsletterIssueCancelled implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $issueId,
        public ?string $actorId,
        public string $reason,
    ) {
    }
}
