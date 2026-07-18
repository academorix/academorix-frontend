<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Enums\SearchPermission;
use Academorix\Search\Models\SearchSavedQuery;
use Illuminate\Http\Response;

/**
 * `DELETE /api/v1/search/saved-queries/{query}` — soft-delete own row.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.tenant.saved_queries.delete')]
#[Delete('/api/v1/search/saved-queries/{query}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('query')]
#[RequirePermission(SearchPermission::SavedQueriesDelete)]
final class DeleteSavedQuery
{
    use AsController;

    public function __invoke(SearchSavedQuery $query): Response
    {
        $query->delete();

        return \response()->noContent();
    }
}
