<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Contracts\Services\IndexOrchestratorInterface;
use Academorix\Search\Data\SearchSyncJobData;
use Academorix\Search\Enums\SearchPermission;
use Academorix\Search\Models\SearchSyncJob;

/**
 * `POST /api/v1/search/sync-jobs/{jobId}/cancel` — cancel own job.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.tenant.sync_jobs.cancel')]
#[Post('/api/v1/search/sync-jobs/{jobId}/cancel')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('jobId')]
#[RequirePermission(SearchPermission::SyncJobsCancel)]
final class CancelSyncJob
{
    use AsController;

    public function __construct(
        private readonly IndexOrchestratorInterface $orchestrator,
    ) {
    }

    public function __invoke(SearchSyncJob $jobId): SearchSyncJobData
    {
        $cancelled = $this->orchestrator->cancel((string) $jobId->getKey());

        return SearchSyncJobData::fromModel($cancelled);
    }
}
