<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Events;

use Stackra\Entitlements\Models\Entitlement;
use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when `ResetPeriodicUsageJob` (or a manual reset) sets
 * `value.used = 0` on a pool-kind entitlement.
 *
 * Payload carries the previous `used` value so listeners can log
 * end-of-period totals before they're wiped.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'entitlements.entitlement.reset')]
final readonly class EntitlementReset implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public Entitlement $entitlement,
        public int $previousUsed,
        public ?\DateTimeInterface $nextResetsAt = null,
    ) {
    }
}
