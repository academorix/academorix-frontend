<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Contracts\Repositories\SearchIndexRepositoryInterface;
use Academorix\Search\Data\SearchIndexData;
use Academorix\Search\Enums\SearchPermission;
use Academorix\Search\Models\SearchIndex;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/search/indexes` — cross-tenant index list.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.platform.indexes.list')]
#[Get('/api/v1/platform/search/indexes')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(SearchPermission::PlatformIndexesViewAny)]
final class ListIndexes
{
    use AsController;

    public function __construct(
        private readonly SearchIndexRepositoryInterface $indexes,
    ) {
    }

    /**
     * @return DataCollection<int, SearchIndexData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->indexes
            ->all()
            ->map(static fn (SearchIndex $i): SearchIndexData => SearchIndexData::fromModel($i));

        return new DataCollection(SearchIndexData::class, $rows);
    }
}
