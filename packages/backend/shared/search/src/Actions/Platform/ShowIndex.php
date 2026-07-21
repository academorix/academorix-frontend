<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Platform;

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
 * `GET /api/v1/platform/search/indexes/{index}` — platform view of one index.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.platform.indexes.show')]
#[Get('/api/v1/platform/search/indexes/{index}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('index')]
#[RequirePermission(SearchPermission::PlatformIndexesView)]
final class ShowIndex
{
    use AsController;

    public function __invoke(SearchIndex $index): SearchIndexData
    {
        return SearchIndexData::fromModel($index);
    }
}
