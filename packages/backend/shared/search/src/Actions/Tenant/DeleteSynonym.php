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
use Academorix\Search\Models\SearchSynonym;
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
