<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Contracts\Services;

use Academorix\Entitlements\Services\NullPlanEntitlementSyncer;
use Illuminate\Container\Attributes\Bind;

/**
 * Sync a tenant's entitlement rows to match a subscription plan's
 * declared defaults.
 *
 * The default {@see NullPlanEntitlementSyncer} is a no-op — the
 * entitlements module boots without the subscription module in the
 * graph. The subscription module (or a consumer app) binds a real
 * implementation via `#[Bind]`.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Bind(NullPlanEntitlementSyncer::class)]
interface PlanEntitlementSyncerInterface
{
    /**
     * Sync one tenant against one plan.
     *
     * Reads the plan's declared entitlement defaults, upserts one
     * `Entitlement` row per declared key on the tenant. Never touches
     * rows with `source = override` — those are enterprise negotiations.
     *
     * @param  string  $tenantId  Owning tenant.
     * @param  string  $planId    Subscription plan identifier.
     * @return int                Number of entitlements upserted.
     */
    public function syncFromPlan(string $tenantId, string $planId): int;
}
