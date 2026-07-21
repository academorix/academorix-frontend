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
use Stackra\Search\Models\SearchSynonym;
use Illuminate\Http\Response;

/**
 * `DELETE /api/v1/search/synonyms/{synonym}` — soft-delete own synonym.
 *
 * System rows are refused by the policy.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.tenant.synonyms.delete')]
#[Delete('/api/v1/search/synonyms/{synonym}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('synonym')]
#[RequirePermission(SearchPermission::SynonymsDelete)]
final class DeleteSynonym
{
    use AsController;

    public function __invoke(SearchSynonym $synonym): Response
    {
        $synonym->delete();

        return \response()->noContent();
    }
}
