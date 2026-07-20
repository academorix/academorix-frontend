<?php

declare(strict_types=1);

namespace Academorix\Subscription\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Subscription\Models\Subscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a renewal payment succeeds (Cashier fired
 * `invoice.payment_succeeded` for a renewal).
 *
 * Consumed by `entitlements::ResetPeriodicUsageForRenewal`.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'subscription.subscription.renewed')]
final readonly class SubscriptionRenewed implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Subscription  $subscription     The renewed subscription.
     * @param  int           $amountMicroUnits Amount charged, in micro-currency.
     * @param  string        $currency         3-letter currency code.
     * @param  \DateTimeInterface|null $nextPeriodEnd Next renewal boundary.
     */
    public function __construct(
        public Subscription $subscription,
        public int $amountMicroUnits,
        public string $currency,
        public ?\DateTimeInterface $nextPeriodEnd = null,
    ) {
    }
}
