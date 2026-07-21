<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Search\Contracts\Repositories\SearchSyncJobRepositoryInterface;
use Stackra\Search\Data\SearchSyncJobData;
use Stackra\Search\Enums\SearchPermission;
use Stackra\Search\Models\SearchSyncJob;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/search/sync-jobs` — cross-tenant sync-job list.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.platform.sync_jobs.list')]
#[Get('/api/v1/platform/search/sync-jobs')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(SearchPermission::PlatformSyncJobsViewAny)]
final class ListSyncJobs
{
    use AsController;

    public function __construct(
        private readonly SearchSyncJobRepositoryInterface $syncJobs,
    ) {
    }

    /**
     * @return DataCollection<int, SearchSyncJobData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->syncJobs
            ->all()
            ->map(static fn (SearchSyncJob $j): SearchSyncJobData => SearchSyncJobData::fromModel($j));

        return new DataCollection(SearchSyncJobData::class, $rows);
    }
}
