<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when `SyncEntitlementsFromPlanJob` finishes successfully.
 *
 * Payload carries the number of entitlement rows the job upserted so
 * observability listeners can count "plan sync produced N rows".
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'entitlements.entitlement.sync_completed')]
final readonly class EntitlementSyncCompleted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $tenantId,
        public string $planId,
        public int $entitlementsUpdated,
    ) {
    }
}
