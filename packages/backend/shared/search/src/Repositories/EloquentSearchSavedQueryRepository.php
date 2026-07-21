<?php

declare(strict_types=1);

namespace Stackra\Search\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Search\Contracts\Data\SearchSavedQueryInterface;
use Stackra\Search\Contracts\Repositories\SearchSavedQueryRepositoryInterface;
use Stackra\Search\Models\SearchSavedQuery;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see SearchSavedQueryRepositoryInterface}.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(SearchSavedQueryInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    SearchSavedQueryInterface::ATTR_TENANT_ID     => ['$eq', '$in'],
    SearchSavedQueryInterface::ATTR_OWNER_ID      => ['$eq'],
    SearchSavedQueryInterface::ATTR_IS_SHARED     => ['$eq'],
    SearchSavedQueryInterface::ATTR_IS_SMART_LIST => ['$eq'],
])]
final class EloquentSearchSavedQueryRepository extends Repository implements SearchSavedQueryRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByOwner(string $ownerId): Collection
    {
        /** @var Collection<int, SearchSavedQuery> $rows */
        $rows = $this->query()
            ->where(SearchSavedQueryInterface::ATTR_OWNER_ID, $ownerId)
            ->orderByDesc(SearchSavedQueryInterface::ATTR_LAST_RUN_AT)
            ->orderBy(SearchSavedQueryInterface::ATTR_NAME)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findSharedByTenant(string $tenantId): Collection
    {
        /** @var Collection<int, SearchSavedQuery> $rows */
        $rows = $this->query()
            ->where(SearchSavedQueryInterface::ATTR_TENANT_ID, $tenantId)
            ->where(SearchSavedQueryInterface::ATTR_IS_SHARED, true)
            ->orderBy(SearchSavedQueryInterface::ATTR_NAME)
            ->get();

        return $rows;
    }
}
