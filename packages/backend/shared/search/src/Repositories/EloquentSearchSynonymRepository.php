<?php

declare(strict_types=1);

namespace Academorix\Search\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Search\Contracts\Data\SearchSynonymInterface;
use Academorix\Search\Contracts\Repositories\SearchSynonymRepositoryInterface;
use Academorix\Search\Models\SearchSynonym;
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
