<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Events;

use Stackra\Entitlements\Models\Entitlement;
use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when `ExportUsageForBillingJob` pushes a
 * metered-billing entitlement's usage to Stripe / Paddle.
 *
 * Payload carries the provider's usage-record id so subsequent
 * reconciliation can look up the record on the provider side.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'entitlements.entitlement.usage_reported_to_billing')]
final readonly class UsageReportedToBilling implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public Entitlement $entitlement,
        public \DateTimeInterface $periodStart,
        public \DateTimeInterface $periodEnd,
        public int $amountReported,
        public string $provider,
        public string $providerUsageRecordId,
    ) {
    }
}
