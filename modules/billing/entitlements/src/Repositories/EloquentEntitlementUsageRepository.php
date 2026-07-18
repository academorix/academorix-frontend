<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Entitlements\Contracts\Data\EntitlementUsageInterface;
use Academorix\Entitlements\Contracts\Repositories\EntitlementUsageRepositoryInterface;
use Academorix\Entitlements\Models\EntitlementUsage;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of
 * {@see EntitlementUsageRepositoryInterface}.
 *
 * Append-only aggregate — the repository never exposes `update()` on
 * a usage row. Cache-avoidant on the write path (every consumption
 * writes a fresh row) but the `sumForPeriod()` aggregation can be
 * memoised by the caller for a request cycle.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(EntitlementUsageInterface::class)]
#[Filterable([
    EntitlementUsageInterface::ATTR_TENANT_ID          => ['$eq', '$in'],
    EntitlementUsageInterface::ATTR_ENTITLEMENT_ID     => ['$eq', '$in'],
    EntitlementUsageInterface::ATTR_KEY                => ['$eq', '$in'],
    EntitlementUsageInterface::ATTR_CURRENT_PERIOD_KEY => ['$eq', '$in'],
])]
final class EloquentEntitlementUsageRepository extends Repository implements EntitlementUsageRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByEntitlement(string $entitlementId): Collection
    {
        /** @var Collection<int, EntitlementUsage> $rows */
        $rows = $this->query()
            ->where(EntitlementUsageInterface::ATTR_ENTITLEMENT_ID, $entitlementId)
            ->orderByDesc(EntitlementUsageInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function sumForPeriod(string $entitlementId, string $periodKey): int
    {
        return (int) $this->query()
            ->where(EntitlementUsageInterface::ATTR_ENTITLEMENT_ID, $entitlementId)
            ->where(EntitlementUsageInterface::ATTR_CURRENT_PERIOD_KEY, $periodKey)
            ->sum(EntitlementUsageInterface::ATTR_DELTA);
    }

    /**
     * {@inheritDoc}
     */
    public function pruneOlderThan(\DateTimeInterface $cutoff): int
    {
        return $this->query()
            ->where(EntitlementUsageInterface::ATTR_CREATED_AT, '<', $cutoff)
            ->delete();
    }
}
