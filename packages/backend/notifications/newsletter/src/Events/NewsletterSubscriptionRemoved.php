<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Events;

use Academorix\Events\Attributes\AsEvent;
use DateTimeInterface;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a subscription is unsubscribed (user action,
 * bounce, complaint, or admin remove).
 *
 * ## Consumers
 *   - `newsletter::UpdateAudienceCache` — refreshes cached audience
 *     lists to drop the removed subscriber.
 *   - `compliance::AuditListener` — writes the unsubscribe audit
 *     trail entry (CAN-SPAM + CASL evidence).
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'newsletter.subscription.removed')]
final readonly class NewsletterSubscriptionRemoved implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string  $subscriptionId  Subscription id.
     * @param  DateTimeInterface  $unsubscribedAt  When the removal
     *                                             happened.
     * @param  string  $reason  One of `user_action`, `bounce`,
     *                          `complaint`, `admin_removed`.
     */
    public function __construct(
        public string $subscriptionId,
        public DateTimeInterface $unsubscribedAt,
        public string $reason,
    ) {
    }
}
