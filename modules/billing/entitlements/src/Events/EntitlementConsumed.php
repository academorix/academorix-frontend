<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Events;

use Academorix\Entitlements\Models\Entitlement;
use Academorix\Entitlements\Models\EntitlementUsage;
use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when the enforcer's consume path succeeds.
 *
 * Fires after the `EntitlementUsage` row commits. Payload carries
 * both the parent + child so listeners have full context (limit +
 * new used + delta) without re-querying.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'entitlements.entitlement.consumed')]
final readonly class EntitlementConsumed implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public Entitlement $entitlement,
        public EntitlementUsage $usage,
        public int $amount,
        public ?string $correlationId = null,
    ) {
    }
}
