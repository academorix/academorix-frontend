<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Contracts\Repositories\SearchSavedQueryRepositoryInterface;
use Academorix\Search\Data\SearchSavedQueryData;
use Academorix\Search\Enums\SearchPermission;
use Academorix\Search\Models\SearchSavedQuery;
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
