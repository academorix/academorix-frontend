<?php

declare(strict_types=1);

namespace Academorix\Subscription\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Subscription\Models\Subscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when Cashier processes `invoice.payment_failed` for a
 * subscription.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'subscription.payment.failed')]
final readonly class PaymentFailed implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Subscription  $subscription      The subscription paid on.
     * @param  int           $amountMicroUnits  Amount attempted in micro-currency.
     * @param  string        $failureReason     Provider-supplied failure message.
     * @param  string        $providerEventId   Provider event id — idempotency key.
     */
    public function __construct(
        public Subscription $subscription,
        public int $amountMicroUnits,
        public string $failureReason,
        public string $providerEventId,
    ) {
    }
}
