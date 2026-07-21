<?php

declare(strict_types=1);

namespace Stackra\Subscription\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Subscription\Models\Subscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Subscription with `cancel_at_period_end=true`
 * is reinstated before the boundary lands.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'subscription.subscription.reinstated')]
final readonly class SubscriptionReinstated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public Subscription $subscription)
    {
    }
}
