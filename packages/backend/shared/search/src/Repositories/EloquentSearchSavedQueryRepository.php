<?php

declare(strict_types=1);

namespace Academorix\Search\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Search\Contracts\Data\SearchSavedQueryInterface;
use Academorix\Search\Contracts\Repositories\SearchSavedQueryRepositoryInterface;
use Academorix\Search\Models\SearchSavedQuery;
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
