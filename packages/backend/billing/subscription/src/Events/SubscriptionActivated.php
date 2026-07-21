<?php

declare(strict_types=1);

namespace Stackra\Subscription\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Subscription\Models\Subscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Subscription transitions to `active` from
 * `trialing` or from a grace state after payment recovery.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'subscription.subscription.activated')]
final readonly class SubscriptionActivated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Subscription  $subscription  The activated subscription.
     * @param  string|null   $fromState     Previous state, when the transition was observed.
     */
    public function __construct(
        public Subscription $subscription,
        public ?string $fromState = null,
    ) {
    }
}
