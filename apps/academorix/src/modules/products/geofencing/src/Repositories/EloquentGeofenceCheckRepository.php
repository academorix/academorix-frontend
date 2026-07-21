<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Academorix\Geofencing\Contracts\Data\GeofenceCheckInterface;
use Academorix\Geofencing\Contracts\Repositories\GeofenceCheckRepositoryInterface;
use Academorix\Geofencing\Models\GeofenceCheck;
use DateTimeInterface;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see GeofenceCheckRepositoryInterface}.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 120, tags: true)]` — audit rows never change (immutability
 * guard), so a two-minute window is safe. The observer flushes tenant tags on
 * inserts so brand-new rows are visible immediately.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(GeofenceCheckInterface::class)]
#[Cacheable(ttl: 120, tags: true)]
#[Filterable([
    GeofenceCheckInterface::ATTR_TENANT_ID       => ['$eq', '$in'],
    GeofenceCheckInterface::ATTR_FENCEABLE_TYPE  => ['$eq', '$in'],
    GeofenceCheckInterface::ATTR_FENCEABLE_ID    => ['$eq'],
    GeofenceCheckInterface::ATTR_SUBJECT_TYPE    => ['$eq', '$in'],
    GeofenceCheckInterface::ATTR_SUBJECT_ID      => ['$eq'],
    GeofenceCheckInterface::ATTR_RESULT          => ['$eq', '$in'],
    GeofenceCheckInterface::ATTR_MODE            => ['$eq', '$in'],
    GeofenceCheckInterface::ATTR_EVALUATED_AT    => ['$gte', '$lte', '$between'],
])]
final class EloquentGeofenceCheckRepository extends Repository implements GeofenceCheckRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByFenceable(string $fenceableType, string $fenceableId): Collection
    {
        /** @var Collection<int, GeofenceCheck> $rows */
        $rows = $this->query()
            ->where(GeofenceCheckInterface::ATTR_FENCEABLE_TYPE, $fenceableType)
            ->where(GeofenceCheckInterface::ATTR_FENCEABLE_ID, $fenceableId)
            ->orderByDesc(GeofenceCheckInterface::ATTR_EVALUATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findBySubject(string $subjectType, string $subjectId): Collection
    {
        /** @var Collection<int, GeofenceCheck> $rows */
        $rows = $this->query()
            ->where(GeofenceCheckInterface::ATTR_SUBJECT_TYPE, $subjectType)
            ->where(GeofenceCheckInterface::ATTR_SUBJECT_ID, $subjectId)
            ->orderByDesc(GeofenceCheckInterface::ATTR_EVALUATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByTenant(string $tenantId, int $limit = 100): Collection
    {
        /** @var Collection<int, GeofenceCheck> $rows */
        $rows = $this->query()
            ->where(GeofenceCheckInterface::ATTR_TENANT_ID, $tenantId)
            ->orderByDesc(GeofenceCheckInterface::ATTR_EVALUATED_AT)
            ->limit($limit)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     *
     * Only non-override rows are soft-deleted at retention time. Override
     * rows carry disputed-clock-in evidence and get a longer floor per
     * `geofencing.retention.override_row_hot_years`.
     */
    public function pruneOlderThan(DateTimeInterface $cutoff): int
    {
        return $this->query()
            ->where(GeofenceCheckInterface::ATTR_CREATED_AT, '<', $cutoff)
            ->whereNull(GeofenceCheckInterface::ATTR_SUPERSEDES_CHECK_ID)
            ->delete();
    }
}
