<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when `SyncEntitlementsFromPlanJob` picks up a
 * subscription plan change and begins syncing.
 *
 * Paired with {@see EntitlementSyncCompleted} which fires after the
 * job commits. Both carry the same `(tenantId, planId)` tuple so
 * downstream consumers can match start ↔ end.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'entitlements.entitlement.sync_started')]
final readonly class EntitlementSyncStarted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $tenantId,
        public string $planId,
        public ?string $fromPlanId = null,
    ) {
    }
}
