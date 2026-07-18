<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Data\SearchSyncJobData;
use Academorix\Search\Enums\SearchPermission;
use Academorix\Search\Models\SearchSyncJob;

/**
 * `GET /api/v1/search/sync-jobs/{jobId}` — read one sync job.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.tenant.sync_jobs.show')]
#[Get('/api/v1/search/sync-jobs/{jobId}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('jobId')]
#[RequirePermission(SearchPermission::SyncJobsView)]
final class ShowSyncJob
{
    use AsController;

    public function __invoke(SearchSyncJob $jobId): SearchSyncJobData
    {
        return SearchSyncJobData::fromModel($jobId);
    }
}
