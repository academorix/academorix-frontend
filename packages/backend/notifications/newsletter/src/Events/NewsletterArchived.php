<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a newsletter transitions to archived state.
 *
 * ## Consumers
 *   - `newsletter::PausePendingCampaigns` — cancels any pending
 *     campaigns for the newsletter.
 *   - `compliance::AuditListener` — writes the audit trail entry.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'newsletter.newsletter.archived')]
final readonly class NewsletterArchived implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string       $newsletterId  Newsletter id.
     * @param  string|null  $actorId       User that archived, or null
     *                                     when the transition was
     *                                     automated (e.g. tenant erase).
     */
    public function __construct(
        public string $newsletterId,
        public ?string $actorId = null,
    ) {
    }
}
