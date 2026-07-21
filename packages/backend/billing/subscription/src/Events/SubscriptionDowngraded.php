<?php

declare(strict_types=1);

namespace Stackra\Subscription\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Subscription\Models\Subscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Subscription swap resolves to a lower tier.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'subscription.subscription.downgraded')]
final readonly class SubscriptionDowngraded implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Subscription  $subscription  The downgraded subscription.
     * @param  string        $fromPlanId    ULID of the previous plan.
     * @param  string        $toPlanId      ULID of the new plan.
     * @param  string|null   $actorId       User who initiated the swap; null for system swaps.
     */
    public function __construct(
        public Subscription $subscription,
        public string $fromPlanId,
        public string $toPlanId,
        public ?string $actorId = null,
    ) {
    }
}
