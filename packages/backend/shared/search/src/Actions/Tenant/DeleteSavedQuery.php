<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Search\Enums\SearchPermission;
use Stackra\Search\Models\SearchSavedQuery;
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
