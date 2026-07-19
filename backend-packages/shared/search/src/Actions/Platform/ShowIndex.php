<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Platform;

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
