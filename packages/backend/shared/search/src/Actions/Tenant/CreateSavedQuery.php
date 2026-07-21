<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Search\Contracts\Data\SearchSavedQueryInterface;
use Stackra\Search\Contracts\Repositories\SearchSavedQueryRepositoryInterface;
use Stackra\Search\Data\Requests\CreateSavedQueryRequestData;
use Stackra\Search\Data\SearchSavedQueryData;
use Stackra\Search\Enums\SearchPermission;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Contracts\Auth\Factory as AuthFactory;

/**
 * `POST /api/v1/search/saved-queries` — create a saved query.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.tenant.saved_queries.create')]
#[Post('/api/v1/search/saved-queries')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SearchPermission::SavedQueriesCreate)]
final class CreateSavedQuery
{
    use AsController;

    public function __construct(
        private readonly SearchSavedQueryRepositoryInterface $savedQueries,
        private readonly TenantContextInterface $tenantContext,
        #[Auth] private readonly AuthFactory $authFactory,
    ) {
    }

    public function __invoke(CreateSavedQueryRequestData $data): SearchSavedQueryData
    {
        $tenant  = $this->tenantContext->currentOrFail();
        $ownerId = (string) $this->authFactory->guard('sanctum')->id();

        $row = $this->savedQueries->create([
            SearchSavedQueryInterface::ATTR_TENANT_ID     => (string) $tenant->getKey(),
            SearchSavedQueryInterface::ATTR_OWNER_ID      => $ownerId,
            SearchSavedQueryInterface::ATTR_NAME          => $data->name,
            SearchSavedQueryInterface::ATTR_DESCRIPTION   => $data->description,
            SearchSavedQueryInterface::ATTR_ACROSS        => $data->across,
            SearchSavedQueryInterface::ATTR_QUERY         => $data->query,
            SearchSavedQueryInterface::ATTR_FILTERS       => $data->filters,
            SearchSavedQueryInterface::ATTR_FACETS        => $data->facets,
            SearchSavedQueryInterface::ATTR_BOOSTS        => $data->boosts,
            SearchSavedQueryInterface::ATTR_IS_SHARED     => $data->isShared,
            SearchSavedQueryInterface::ATTR_IS_SMART_LIST => $data->isSmartList,
        ]);

        return SearchSavedQueryData::fromModel($row);
    }
}
