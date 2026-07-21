<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Events;

use Stackra\Events\Attributes\AsEvent;
use DateTimeInterface;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when notifications-mail records an open event tied to
 * a newsletter delivery.
 *
 * ## Consumers
 *   - `newsletter::UpdateEngagementScore` — recomputes the
 *     subscription's engagement_score via the tracker job.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'newsletter.open.recorded')]
final readonly class NewsletterOpenRecorded implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $subscriptionId,
        public string $campaignId,
        public DateTimeInterface $openedAt,
    ) {
    }
}
