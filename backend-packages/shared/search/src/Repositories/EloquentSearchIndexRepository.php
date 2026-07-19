<?php

declare(strict_types=1);

namespace Academorix\Search\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Search\Contracts\Data\SearchIndexInterface;
use Academorix\Search\Contracts\Repositories\SearchIndexRepositoryInterface;
use Academorix\Search\Models\SearchIndex;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see SearchIndexRepositoryInterface}.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(SearchIndexInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    SearchIndexInterface::ATTR_TENANT_ID   => ['$eq', '$in'],
    SearchIndexInterface::ATTR_MODEL_CLASS => ['$eq', '$in'],
    SearchIndexInterface::ATTR_ENGINE      => ['$eq', '$in'],
    SearchIndexInterface::ATTR_STATUS      => ['$eq', '$in'],
    SearchIndexInterface::ATTR_LANGUAGE    => ['$eq', '$in'],
])]
final class EloquentSearchIndexRepository extends Repository implements SearchIndexRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByModelClass(string $modelClass, ?string $tenantId = null): ?SearchIndex
    {
        /** @var SearchIndex|null $row */
        $row = $this->query()
            ->where(SearchIndexInterface::ATTR_MODEL_CLASS, $modelClass)
            ->when(
                $tenantId !== null,
                static fn ($q) => $q->where(SearchIndexInterface::ATTR_TENANT_ID, $tenantId),
            )
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findByTenant(string $tenantId): Collection
    {
        /** @var Collection<int, SearchIndex> $rows */
        $rows = $this->query()
            ->where(SearchIndexInterface::ATTR_TENANT_ID, $tenantId)
            ->orderBy(SearchIndexInterface::ATTR_MODEL_CLASS)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByEngine(string $engine): Collection
    {
        /** @var Collection<int, SearchIndex> $rows */
        $rows = $this->query()
            ->where(SearchIndexInterface::ATTR_ENGINE, $engine)
            ->orderBy(SearchIndexInterface::ATTR_MODEL_CLASS)
            ->get();

        return $rows;
    }
}
