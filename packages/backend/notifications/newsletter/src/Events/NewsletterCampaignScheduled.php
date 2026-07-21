<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Events;

use Stackra\Events\Attributes\AsEvent;
use DateTimeInterface;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a campaign row is created (state=pending).
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'newsletter.campaign.scheduled')]
final readonly class NewsletterCampaignScheduled implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $campaignId,
        public DateTimeInterface $scheduledAt,
    ) {
    }
}
