<?php

declare(strict_types=1);

namespace Stackra\Search\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Search\Models\SearchSavedQuery;
use Stackra\Search\Repositories\EloquentSearchSavedQueryRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see SearchSavedQuery}.
 *
 * @extends RepositoryInterface<SearchSavedQuery>
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Bind(EloquentSearchSavedQueryRepository::class)]
interface SearchSavedQueryRepositoryInterface extends RepositoryInterface
{
    /**
     * Saved queries owned by one user (own + tenant-shared visible via
     * the policy layer).
     *
     * @return Collection<int, SearchSavedQuery>
     */
    public function findByOwner(string $ownerId): Collection;

    /**
     * Every tenant-shared saved query in a tenant.
     *
     * @return Collection<int, SearchSavedQuery>
     */
    public function findSharedByTenant(string $tenantId): Collection;
}
