<?php

declare(strict_types=1);

namespace Stackra\Subscription\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Subscription\Models\Subscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Subscription swap stays within the same tier
 * (e.g. monthly → annual).
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'subscription.subscription.switched')]
final readonly class SubscriptionSwitched implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Subscription  $subscription  The switched subscription.
     * @param  string        $fromPlanId    ULID of the previous plan.
     * @param  string        $toPlanId      ULID of the new plan.
     */
    public function __construct(
        public Subscription $subscription,
        public string $fromPlanId,
        public string $toPlanId,
    ) {
    }
}
