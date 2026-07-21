<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Search\Contracts\Repositories\SearchSavedQueryRepositoryInterface;
use Stackra\Search\Data\SearchSavedQueryData;
use Stackra\Search\Enums\SearchPermission;
use Stackra\Search\Models\SearchSavedQuery;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Container\Attributes\Auth;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/search/saved-queries` — list saved queries owned by
 * the caller.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.tenant.saved_queries.list')]
#[Get('/api/v1/search/saved-queries')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SearchPermission::SavedQueriesViewAny)]
final class ListSavedQueries
{
    use AsController;

    public function __construct(
        private readonly SearchSavedQueryRepositoryInterface $savedQueries,
        #[Auth] private readonly AuthFactory $authFactory,
    ) {
    }

    /**
     * @return DataCollection<int, SearchSavedQueryData>
     */
    public function __invoke(): DataCollection
    {
        $ownerId = (string) $this->authFactory->guard('sanctum')->id();

        $rows = $this->savedQueries
            ->findByOwner($ownerId)
            ->map(static fn (SearchSavedQuery $q): SearchSavedQueryData => SearchSavedQueryData::fromModel($q));

        return new DataCollection(SearchSavedQueryData::class, $rows);
    }
}
