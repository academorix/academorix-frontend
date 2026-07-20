<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Contracts\Repositories\SearchSyncJobRepositoryInterface;
use Academorix\Search\Data\SearchSyncJobData;
use Academorix\Search\Enums\SearchPermission;
use Academorix\Search\Models\SearchSyncJob;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/search/sync-jobs` — list sync jobs for the tenant.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.tenant.sync_jobs.list')]
#[Get('/api/v1/search/sync-jobs')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SearchPermission::SyncJobsViewAny)]
final class ListSyncJobs
{
    use AsController;

    public function __construct(
        private readonly SearchSyncJobRepositoryInterface $syncJobs,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * @return DataCollection<int, SearchSyncJobData>
     */
    public function __invoke(): DataCollection
    {
        $tenant = $this->tenantContext->currentOrFail();

        $rows = $this->syncJobs
            ->findByTenant((string) $tenant->getKey())
            ->map(static fn (SearchSyncJob $j): SearchSyncJobData => SearchSyncJobData::fromModel($j));

        return new DataCollection(SearchSyncJobData::class, $rows);
    }
}
