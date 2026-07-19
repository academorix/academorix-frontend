<?php

declare(strict_types=1);

namespace Academorix\Subscription\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Subscription\Models\Subscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when Cashier flags a subscription past_due — first
 * payment failure. Our state transitions to `at_risk`.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'subscription.subscription.past_due')]
final readonly class SubscriptionPastDue implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public Subscription $subscription,
        public ?\DateTimeInterface $graceEndsAt = null,
    ) {
    }
}
