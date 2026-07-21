<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when the orchestrator hits a fatal error and marks the
 * campaign `failed`.
 *
 * ## Consumers
 *   - `notifications::DispatchNewsletterCampaignFailedNotification`
 *     — emails the newsletter owner. Non-opt-outable — critical
 *     transactional signal.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'newsletter.campaign.failed')]
final readonly class NewsletterCampaignFailed implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $campaignId,
        public string $reason,
    ) {
    }
}
