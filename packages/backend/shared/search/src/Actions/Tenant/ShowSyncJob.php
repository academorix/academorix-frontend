<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Search\Data\SearchSyncJobData;
use Stackra\Search\Enums\SearchPermission;
use Stackra\Search\Models\SearchSyncJob;

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
