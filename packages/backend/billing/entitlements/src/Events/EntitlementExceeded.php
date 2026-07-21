<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Events;

use Stackra\Entitlements\Models\Entitlement;
use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a `consume()` call was rejected because
 * `used + delta > limit`.
 *
 * Payload carries the parent entitlement + the attempted amount so
 * notifications can show "3 of 10 used, 8 requested" without a
 * follow-up query.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'entitlements.entitlement.exceeded')]
final readonly class EntitlementExceeded implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public Entitlement $entitlement,
        public int $attemptedAmount,
    ) {
    }
}
