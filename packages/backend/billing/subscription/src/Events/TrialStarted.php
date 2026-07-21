<?php

declare(strict_types=1);

namespace Stackra\Subscription\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Subscription\Models\Subscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a trial subscription begins.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'subscription.trial.started')]
final readonly class TrialStarted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public Subscription $subscription,
        public ?\DateTimeInterface $trialEndsAt = null,
    ) {
    }
}
