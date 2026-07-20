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
use Academorix\Search\Models\SearchSyncJob;

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
