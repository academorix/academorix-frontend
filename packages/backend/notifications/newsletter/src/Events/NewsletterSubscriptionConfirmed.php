<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Events;

use Academorix\Events\Attributes\AsEvent;
use DateTimeInterface;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a subscription's state moves from
 * `pending_confirmation` to `active`.
 *
 * ## Consumers
 *   - `newsletter::UpdateAudienceCache` — invalidates the default
 *     audience's cached subscriber list.
 *   - `compliance::AuditListener` — writes the double-opt-in
 *     confirmation audit trail entry.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'newsletter.subscription.confirmed')]
final readonly class NewsletterSubscriptionConfirmed implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $subscriptionId,
        public DateTimeInterface $confirmedAt,
    ) {
    }
}
