<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Search\Data\SearchIndexData;
use Stackra\Search\Enums\SearchPermission;
use Stackra\Search\Models\SearchIndex;

/**
 * `GET /api/v1/search/indexes/{index}` — read one tenant-scoped index.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.tenant.indexes.show')]
#[Get('/api/v1/search/indexes/{index}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('index')]
#[RequirePermission(SearchPermission::IndexesView)]
final class ShowIndex
{
    use AsController;

    public function __invoke(SearchIndex $index): SearchIndexData
    {
        return SearchIndexData::fromModel($index);
    }
}
