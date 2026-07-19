<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Data\SearchIndexData;
use Academorix\Search\Enums\SearchPermission;
use Academorix\Search\Models\SearchIndex;

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
