<?php

declare(strict_types=1);

namespace Academorix\Subscription\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Subscription\Models\Subscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when Cashier processes `invoice.payment_succeeded` for
 * a subscription.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'subscription.payment.succeeded')]
final readonly class PaymentSucceeded implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Subscription  $subscription      The subscription paid on.
     * @param  int           $amountMicroUnits  Amount charged in micro-currency.
     * @param  string        $currency          3-letter currency code.
     * @param  string        $invoiceNumber     Provider invoice reference.
     * @param  string        $providerEventId   Provider event id — idempotency key.
     */
    public function __construct(
        public Subscription $subscription,
        public int $amountMicroUnits,
        public string $currency,
        public string $invoiceNumber,
        public string $providerEventId,
    ) {
    }
}
