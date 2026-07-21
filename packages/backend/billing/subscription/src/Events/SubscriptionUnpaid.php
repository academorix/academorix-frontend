<?php

declare(strict_types=1);

namespace Stackra\Subscription\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Subscription\Models\Subscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when past_due extended past the retry window. Our
 * state transitions to `grace`.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'subscription.subscription.unpaid')]
final readonly class SubscriptionUnpaid implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public Subscription $subscription,
        public int $consecutiveFailures = 0,
    ) {
    }
}
