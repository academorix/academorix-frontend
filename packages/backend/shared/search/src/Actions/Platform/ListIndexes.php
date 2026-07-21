<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Search\Contracts\Repositories\SearchIndexRepositoryInterface;
use Stackra\Search\Data\SearchIndexData;
use Stackra\Search\Enums\SearchPermission;
use Stackra\Search\Models\SearchIndex;
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
