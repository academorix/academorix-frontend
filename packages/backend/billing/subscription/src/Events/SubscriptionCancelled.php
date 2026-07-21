<?php

declare(strict_types=1);

namespace Stackra\Subscription\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Subscription\Models\Subscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Subscription is cancelled — either
 * `cancel_at_period_end=true` (deferred) or immediate.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'subscription.subscription.cancelled')]
final readonly class SubscriptionCancelled implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Subscription  $subscription        The cancelled subscription.
     * @param  bool          $cancelAtPeriodEnd   Whether the cancel is deferred to period end.
     * @param  string|null   $reason              Optional operator note.
     * @param  string|null   $actorId             User / admin who initiated; null for provider webhooks.
     */
    public function __construct(
        public Subscription $subscription,
        public bool $cancelAtPeriodEnd,
        public ?string $reason = null,
        public ?string $actorId = null,
    ) {
    }
}
