<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Contracts\Services\IndexOrchestratorInterface;
use Academorix\Search\Data\SearchSyncJobData;
use Academorix\Search\Enums\SearchPermission;
use Academorix\Search\Models\SearchIndex;

/**
 * `POST /api/v1/platform/search/indexes/{index}/reindex` — trigger a
 * zero-downtime reindex.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.platform.indexes.reindex')]
#[Post('/api/v1/platform/search/indexes/{index}/reindex')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('index')]
#[RequirePermission(SearchPermission::PlatformIndexesReindex)]
final class ReindexIndex
{
    use AsController;

    public function __construct(
        private readonly IndexOrchestratorInterface $orchestrator,
    ) {
    }

    public function __invoke(SearchIndex $index): SearchSyncJobData
    {
        $job = $this->orchestrator->reindex((string) $index->getKey());

        return SearchSyncJobData::fromModel($job);
    }
}
