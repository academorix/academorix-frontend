<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Search\Contracts\Repositories\SearchSyncJobRepositoryInterface;
use Stackra\Search\Data\SearchSyncJobData;
use Stackra\Search\Enums\SearchPermission;
use Stackra\Search\Models\SearchSyncJob;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
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
