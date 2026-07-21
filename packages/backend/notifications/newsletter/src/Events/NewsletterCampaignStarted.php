<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when the send orchestrator starts a campaign (state
 * transitions to `in_progress`).
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'newsletter.campaign.started')]
final readonly class NewsletterCampaignStarted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public string $campaignId)
    {
    }
}
