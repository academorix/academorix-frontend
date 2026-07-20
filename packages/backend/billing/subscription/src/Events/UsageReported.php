<?php

declare(strict_types=1);

namespace Academorix\Subscription\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Subscription\Models\Subscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when metered usage is successfully reported to Stripe /
 * Paddle via Cashier's `reportUsage()`.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'subscription.usage.reported')]
final readonly class UsageReported implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Subscription  $subscription             The subscription reported on.
     * @param  string        $meterKey                 Meter identifier.
     * @param  int           $amount                   Usage delta reported.
     * @param  string        $providerUsageRecordId    Provider's usage-record id.
     */
    public function __construct(
        public Subscription $subscription,
        public string $meterKey,
        public int $amount,
        public string $providerUsageRecordId,
    ) {
    }
}
