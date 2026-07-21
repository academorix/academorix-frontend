<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when {@see \Stackra\Newsletter\Jobs\BuildAudienceSegmentJob}
 * rewrites an audience's cached subscriber list.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'newsletter.audience.refreshed')]
final readonly class NewsletterAudienceRefreshed implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $audienceId,
        public int $subscriberCount,
    ) {
    }
}
