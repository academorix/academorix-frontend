<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Search\Data\SearchSynonymData;
use Stackra\Search\Enums\SearchPermission;
use Stackra\Search\Models\SearchSynonym;

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
