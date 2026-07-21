<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Services;

use Stackra\Entitlements\Contracts\Services\PlanEntitlementSyncerInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default no-op implementation of
 * {@see PlanEntitlementSyncerInterface}.
 *
 * The entitlements module boots without the subscription module in
 * the graph. Every sync call returns `0` — the caller sees "nothing
 * to sync" instead of a fatal. The subscription module (or a consumer
 * app) binds a real implementation via `#[Bind]` when it ships.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Singleton]
final class NullPlanEntitlementSyncer implements PlanEntitlementSyncerInterface
{
    /**
     * {@inheritDoc}
     */
    public function syncFromPlan(string $tenantId, string $planId): int
    {
        // No-op — nothing to sync without a real syncer bound.
        return 0;
    }
}
