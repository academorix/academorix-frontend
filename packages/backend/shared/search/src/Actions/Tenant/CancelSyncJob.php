<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Search\Contracts\Services\IndexOrchestratorInterface;
use Stackra\Search\Data\SearchSyncJobData;
use Stackra\Search\Enums\SearchPermission;
use Stackra\Search\Models\SearchSyncJob;

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
