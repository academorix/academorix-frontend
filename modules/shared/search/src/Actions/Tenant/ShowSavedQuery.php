<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Data\SearchSavedQueryData;
use Academorix\Search\Enums\SearchPermission;
use Academorix\Search\Models\SearchSavedQuery;

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
