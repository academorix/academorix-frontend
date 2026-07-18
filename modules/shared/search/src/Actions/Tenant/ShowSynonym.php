<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Data\SearchSynonymData;
use Academorix\Search\Enums\SearchPermission;
use Academorix\Search\Models\SearchSynonym;

/**
 * `GET /api/v1/search/synonyms/{synonym}` — read one synonym.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.tenant.synonyms.show')]
#[Get('/api/v1/search/synonyms/{synonym}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('synonym')]
#[RequirePermission(SearchPermission::SynonymsView)]
final class ShowSynonym
{
    use AsController;

    public function __invoke(SearchSynonym $synonym): SearchSynonymData
    {
        return SearchSynonymData::fromModel($synonym);
    }
}
