<?php

declare(strict_types=1);

namespace Stackra\Subscription\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Subscription\Models\Subscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a new Subscription is first persisted.
 *
 * Consumed by
 * `entitlements::SyncEntitlementsFromPlanListener` +
 * `notifications::DispatchSubscriptionStartedNotification`.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'subscription.subscription.started')]
final readonly class SubscriptionStarted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public Subscription $subscription)
    {
    }
}
