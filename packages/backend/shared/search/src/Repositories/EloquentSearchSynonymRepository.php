<?php

declare(strict_types=1);

namespace Stackra\Search\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Search\Contracts\Data\SearchSynonymInterface;
use Stackra\Search\Contracts\Repositories\SearchSynonymRepositoryInterface;
use Stackra\Search\Models\SearchSynonym;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see SearchSynonymRepositoryInterface}.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(SearchSynonymInterface::class)]
#[Cacheable(ttl: 300, tags: true)]
#[Filterable([
    SearchSynonymInterface::ATTR_TENANT_ID       => ['$eq', '$in'],
    SearchSynonymInterface::ATTR_SEARCH_INDEX_ID => ['$eq', '$in'],
    SearchSynonymInterface::ATTR_LANGUAGE        => ['$eq', '$in'],
    SearchSynonymInterface::ATTR_KIND            => ['$eq', '$in'],
    SearchSynonymInterface::ATTR_IS_ACTIVE       => ['$eq'],
    SearchSynonymInterface::ATTR_IS_SYSTEM       => ['$eq'],
])]
final class EloquentSearchSynonymRepository extends Repository implements SearchSynonymRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function activeFor(?string $tenantId, string $language): Collection
    {
        /** @var Collection<int, SearchSynonym> $rows */
        $rows = $this->query()
            ->where(SearchSynonymInterface::ATTR_LANGUAGE, $language)
            ->where(SearchSynonymInterface::ATTR_IS_ACTIVE, true)
            ->when(
                $tenantId !== null,
                static fn ($q) => $q->where(function ($inner) use ($tenantId): void {
                    $inner->where(SearchSynonymInterface::ATTR_TENANT_ID, $tenantId)
                        ->orWhereNull(SearchSynonymInterface::ATTR_TENANT_ID);
                }),
                static fn ($q) => $q->whereNull(SearchSynonymInterface::ATTR_TENANT_ID),
            )
            ->orderBy(SearchSynonymInterface::ATTR_KIND)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function systemRows(): Collection
    {
        /** @var Collection<int, SearchSynonym> $rows */
        $rows = $this->query()
            ->where(SearchSynonymInterface::ATTR_IS_SYSTEM, true)
            ->orderBy(SearchSynonymInterface::ATTR_LANGUAGE)
            ->get();

        return $rows;
    }
}
