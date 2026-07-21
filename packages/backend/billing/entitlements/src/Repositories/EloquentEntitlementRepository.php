<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Entitlements\Contracts\Data\EntitlementInterface;
use Stackra\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Stackra\Entitlements\Enums\EntitlementKind;
use Stackra\Entitlements\Models\Entitlement;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see EntitlementRepositoryInterface}.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 60, tags: true)]` — a short TTL because
 * entitlement state can flip (plan sync, manual override) at any
 * moment; the observer flushes tenant tags on writes so readers see
 * the new state immediately.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(EntitlementInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    EntitlementInterface::ATTR_TENANT_ID => ['$eq', '$in'],
    EntitlementInterface::ATTR_KEY       => ['$eq', '$in'],
    EntitlementInterface::ATTR_KIND      => ['$eq', '$in'],
    EntitlementInterface::ATTR_SOURCE    => ['$eq', '$in'],
])]
final class EloquentEntitlementRepository extends Repository implements EntitlementRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByKey(string $tenantId, string $key): ?Entitlement
    {
        /** @var Entitlement|null $row */
        $row = $this->query()
            ->where(EntitlementInterface::ATTR_TENANT_ID, $tenantId)
            ->where(EntitlementInterface::ATTR_KEY, $key)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findAllForTenant(string $tenantId): Collection
    {
        /** @var Collection<int, Entitlement> $rows */
        $rows = $this->query()
            ->where(EntitlementInterface::ATTR_TENANT_ID, $tenantId)
            ->orderBy(EntitlementInterface::ATTR_KEY)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByKind(EntitlementKind $kind): Collection
    {
        /** @var Collection<int, Entitlement> $rows */
        $rows = $this->query()
            ->where(EntitlementInterface::ATTR_KIND, $kind->value)
            ->orderBy(EntitlementInterface::ATTR_TENANT_ID)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     *
     * Only pool-kind rows carry a period-end column, so a null-check
     * filters slot / boolean / unlimited rows out of the reset scan.
     */
    public function findExpiringBefore(\DateTimeInterface $cutoff): Collection
    {
        /** @var Collection<int, Entitlement> $rows */
        $rows = $this->query()
            ->where(EntitlementInterface::ATTR_KIND, EntitlementKind::Pool->value)
            ->whereNotNull(EntitlementInterface::ATTR_CURRENT_PERIOD_ENDS_AT)
            ->where(EntitlementInterface::ATTR_CURRENT_PERIOD_ENDS_AT, '<', $cutoff)
            ->orderBy(EntitlementInterface::ATTR_CURRENT_PERIOD_ENDS_AT)
            ->get();

        return $rows;
    }
}
