<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Contracts\Repositories\SearchSyncJobRepositoryInterface;
use Academorix\Search\Data\SearchSyncJobData;
use Academorix\Search\Enums\SearchPermission;
use Academorix\Search\Models\SearchSyncJob;
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
