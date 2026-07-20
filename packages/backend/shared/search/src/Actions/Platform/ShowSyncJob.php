<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Platform;

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
 * `GET /api/v1/platform/search/sync-jobs/{jobId}` — platform view.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.platform.sync_jobs.show')]
#[Get('/api/v1/platform/search/sync-jobs/{jobId}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('jobId')]
#[RequirePermission(SearchPermission::PlatformSyncJobsView)]
final class ShowSyncJob
{
    use AsController;

    public function __invoke(SearchSyncJob $jobId): SearchSyncJobData
    {
        return SearchSyncJobData::fromModel($jobId);
    }
}
