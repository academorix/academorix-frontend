<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Contracts\Services;

use Stackra\Entitlements\Services\DefaultUsageAggregator;
use Illuminate\Container\Attributes\Bind;

/**
 * Aggregate `EntitlementUsage` rows for one entitlement over one
 * period.
 *
 * Backs the reconcile job (compare Redis counter vs Postgres source)
 * and the admin surface (show per-period usage in the tenant panel).
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Bind(DefaultUsageAggregator::class)]
interface UsageAggregatorInterface
{
    /**
     * Total consumption for `(tenant, key)` within one period.
     *
     * @param  string  $tenantId   Owning tenant.
     * @param  string  $key        Dot-separated identifier.
     * @param  string  $periodKey  Period identifier (e.g. `2026-07`).
     * @return int                 Sum of deltas for the period.
     */
    public function aggregate(string $tenantId, string $key, string $periodKey): int;
}
