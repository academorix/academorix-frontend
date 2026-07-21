<?php

declare(strict_types=1);

namespace Stackra\Subscription\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Subscription\Models\Subscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when `trial_ends_at` is reached — the subscription
 * transitions to `active` (converted) or `cancelled` (no payment
 * method).
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'subscription.trial.ended')]
final readonly class TrialEnded implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public Subscription $subscription,
        public bool $converted = false,
    ) {
    }
}
