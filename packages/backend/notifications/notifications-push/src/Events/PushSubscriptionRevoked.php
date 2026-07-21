<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Events;

use Stackra\Notifications\Push\Models\PushSubscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

use Stackra\Events\Attributes\AsEvent;
/**
 * A user or admin explicitly deleted a {@see PushSubscription}.
 *
 * Fired from the observer's `deleted` (soft-delete) hook. Distinct from
 * {@see PushSubscriptionExpired} — this one is caller-initiated; expired rows
 * are provider- or job-initiated.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class PushSubscriptionRevoked implements ShouldDispatchAfterCommit
{
    public function __construct(
        public PushSubscription $subscription,
        public ?string $revokedByUserId = null,
    ) {
    }
}
