<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Events;

use Academorix\Notifications\Push\Models\PushSubscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

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
final readonly class PushSubscriptionRegistered implements ShouldDispatchAfterCommit
{
    public function __construct(
        public PushSubscription $subscription,
    ) {
    }
}
