<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Search\Contracts\Services\IndexOrchestratorInterface;
use Stackra\Search\Data\SearchSyncJobData;
use Stackra\Search\Enums\SearchPermission;
use Stackra\Search\Models\SearchIndex;

/**
 * `POST /api/v1/platform/search/indexes/{index}/flush` — drop an index.
 *
 * Destructive. Requires explicit confirmation payload.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.platform.indexes.flush')]
#[Post('/api/v1/platform/search/indexes/{index}/flush')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('index')]
#[RequirePermission(SearchPermission::PlatformIndexesFlush)]
final class FlushIndex
{
    use AsController;

    public function __construct(
        private readonly IndexOrchestratorInterface $orchestrator,
    ) {
    }

    public function __invoke(SearchIndex $index): SearchSyncJobData
    {
        $job = $this->orchestrator->flush((string) $index->getKey());

        return SearchSyncJobData::fromModel($job);
    }
}
