<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Services;

use Stackra\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Stackra\Entitlements\Contracts\Repositories\EntitlementUsageRepositoryInterface;
use Stackra\Entitlements\Contracts\Services\UsageAggregatorInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default {@see UsageAggregatorInterface}.
 *
 * Resolves the entitlement id from `(tenant, key)`, then delegates
 * to the usage repository's `sumForPeriod()` — one SQL SUM per call.
 * Callers memoise for a request cycle if they need the same period
 * twice.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultUsageAggregator implements UsageAggregatorInterface
{
    public function __construct(
        private readonly EntitlementRepositoryInterface $entitlements,
        private readonly EntitlementUsageRepositoryInterface $usages,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function aggregate(string $tenantId, string $key, string $periodKey): int
    {
        $entitlement = $this->entitlements->findByKey($tenantId, $key);
        if ($entitlement === null) {
            return 0;
        }

        return $this->usages->sumForPeriod((string) $entitlement->getKey(), $periodKey);
    }
}
