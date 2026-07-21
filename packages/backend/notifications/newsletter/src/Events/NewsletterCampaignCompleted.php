<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when every batch has completed and the campaign is
 * marked `completed`.
 *
 * ## Consumers
 *   - `notifications::DispatchNewsletterCampaignCompletedNotification`
 *     — emails the newsletter owner with the summary counters.
 *   - `newsletter::EvaluateReputation` — evaluates the counters
 *     against reputation thresholds.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'newsletter.campaign.completed')]
final readonly class NewsletterCampaignCompleted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string                $campaignId  Campaign id.
     * @param  array<string, mixed>  $counters    Final counters map.
     */
    public function __construct(
        public string $campaignId,
        public array $counters,
    ) {
    }
}
