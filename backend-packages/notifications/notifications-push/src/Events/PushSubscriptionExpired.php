<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Events;

use Academorix\Notifications\Push\Enums\PushSubscriptionExpiredReason;
use Academorix\Notifications\Push\Models\PushSubscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

use Academorix\Events\Attributes\AsEvent;
/**
 * A {@see PushSubscription} became inactive.
 *
 * Fired when the provider reports an invalid token, when the user revokes the
 * OS-level permission, or when the idle-prune job flags a stale row. Listeners
 * invalidate caches + write the audit trail.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class PushSubscriptionExpired implements ShouldDispatchAfterCommit
{
    public function __construct(
        public PushSubscription $subscription,
        public PushSubscriptionExpiredReason $reason,
    ) {
    }
}
