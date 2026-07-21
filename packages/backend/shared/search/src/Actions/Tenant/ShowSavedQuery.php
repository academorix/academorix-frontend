<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Search\Data\SearchSavedQueryData;
use Stackra\Search\Enums\SearchPermission;
use Stackra\Search\Models\SearchSavedQuery;

/**
 * `GET /api/v1/search/saved-queries/{query}` — read one saved query.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.tenant.saved_queries.show')]
#[Get('/api/v1/search/saved-queries/{query}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('query')]
#[RequirePermission(SearchPermission::SavedQueriesView)]
final class ShowSavedQuery
{
    use AsController;

    public function __invoke(SearchSavedQuery $query): SearchSavedQueryData
    {
        return SearchSavedQueryData::fromModel($query);
    }
}
