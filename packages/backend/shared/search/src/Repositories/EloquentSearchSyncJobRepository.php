<?php

declare(strict_types=1);

namespace Academorix\Search\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Search\Contracts\Data\SearchSyncJobInterface;
use Academorix\Search\Contracts\Repositories\SearchSyncJobRepositoryInterface;
use Academorix\Search\Models\SearchSyncJob;
use DateTimeInterface;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see SearchSyncJobRepositoryInterface}.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(SearchSyncJobInterface::class)]
#[Cacheable(ttl: 30, tags: true)]
#[Filterable([
    SearchSyncJobInterface::ATTR_TENANT_ID       => ['$eq', '$in'],
    SearchSyncJobInterface::ATTR_SEARCH_INDEX_ID => ['$eq', '$in'],
    SearchSyncJobInterface::ATTR_KIND            => ['$eq', '$in'],
    SearchSyncJobInterface::ATTR_STATUS          => ['$eq', '$in'],
    SearchSyncJobInterface::ATTR_SOURCE          => ['$eq', '$in'],
    SearchSyncJobInterface::ATTR_CAUSER_TYPE     => ['$eq'],
    SearchSyncJobInterface::ATTR_CAUSER_ID       => ['$eq'],
    SearchSyncJobInterface::ATTR_CREATED_AT      => ['$gte', '$lte', '$between'],
])]
final class EloquentSearchSyncJobRepository extends Repository implements SearchSyncJobRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByTenant(string $tenantId, int $limit = 100): Collection
    {
        /** @var Collection<int, SearchSyncJob> $rows */
        $rows = $this->query()
            ->where(SearchSyncJobInterface::ATTR_TENANT_ID, $tenantId)
            ->orderByDesc(SearchSyncJobInterface::ATTR_CREATED_AT)
            ->limit($limit)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByCauser(string $causerType, string $causerId): Collection
    {
        /** @var Collection<int, SearchSyncJob> $rows */
        $rows = $this->query()
            ->where(SearchSyncJobInterface::ATTR_CAUSER_TYPE, $causerType)
            ->where(SearchSyncJobInterface::ATTR_CAUSER_ID, $causerId)
            ->orderByDesc(SearchSyncJobInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByIndex(string $searchIndexId): Collection
    {
        /** @var Collection<int, SearchSyncJob> $rows */
        $rows = $this->query()
            ->where(SearchSyncJobInterface::ATTR_SEARCH_INDEX_ID, $searchIndexId)
            ->orderByDesc(SearchSyncJobInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByStatus(array $statuses): Collection
    {
        /** @var Collection<int, SearchSyncJob> $rows */
        $rows = $this->query()
            ->whereIn(SearchSyncJobInterface::ATTR_STATUS, $statuses)
            ->orderByDesc(SearchSyncJobInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function pruneOlderThan(DateTimeInterface $cutoff): int
    {
        return $this->query()
            ->where(SearchSyncJobInterface::ATTR_CREATED_AT, '<', $cutoff)
            ->delete();
    }
}
