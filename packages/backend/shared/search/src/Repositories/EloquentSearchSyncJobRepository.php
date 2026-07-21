<?php

declare(strict_types=1);

namespace Stackra\Search\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Search\Contracts\Data\SearchSyncJobInterface;
use Stackra\Search\Contracts\Repositories\SearchSyncJobRepositoryInterface;
use Stackra\Search\Models\SearchSyncJob;
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
