<?php

declare(strict_types=1);

namespace Stackra\Subscription\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Subscription\Models\Subscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when grace exhausted — full tenant suspension. State
 * transitions to `suspended`.
 *
 * Consumed by
 * `notifications::DispatchSubscriptionSuspendedNotification` and
 * `tenancy::HandleTenantSuspension`.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'subscription.subscription.suspended')]
final readonly class SubscriptionSuspended implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public Subscription $subscription)
    {
    }
}
