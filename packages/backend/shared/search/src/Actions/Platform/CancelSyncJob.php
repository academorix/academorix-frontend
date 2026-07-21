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
use Stackra\Search\Models\SearchSyncJob;

/**
 * `POST /api/v1/platform/search/sync-jobs/{jobId}/cancel` — platform admin
 * cancel any state.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.platform.sync_jobs.cancel')]
#[Post('/api/v1/platform/search/sync-jobs/{jobId}/cancel')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('jobId')]
#[RequirePermission(SearchPermission::PlatformSyncJobsCancel)]
final class CancelSyncJob
{
    use AsController;

    public function __construct(
        private readonly IndexOrchestratorInterface $orchestrator,
    ) {
    }

    public function __invoke(SearchSyncJob $jobId): SearchSyncJobData
    {
        $cancelled = $this->orchestrator->cancel(
            (string) $jobId->getKey(),
            'platform-admin cancel',
        );

        return SearchSyncJobData::fromModel($cancelled);
    }
}
