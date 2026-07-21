<?php

declare(strict_types=1);

namespace Stackra\Search\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Search\Contracts\Data\SearchIndexInterface;
use Stackra\Search\Contracts\Repositories\SearchIndexRepositoryInterface;
use Stackra\Search\Models\SearchIndex;
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
