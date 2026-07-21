<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Events;

use Stackra\Notifications\Push\Models\PushSubscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

use Stackra\Events\Attributes\AsEvent;
/**
 * A new {@see PushSubscription} was persisted.
 *
 * Fired from the observer's `created` hook. Consumed by the compliance audit
 * listener + cache warmer.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class PushSubscriptionRegistered implements ShouldDispatchAfterCommit
{
    public function __construct(
        public PushSubscription $subscription,
    ) {
    }
}
