<?php

declare(strict_types=1);

namespace Academorix\Activity\Actions\Tenant;

use Academorix\Activity\Contracts\Repositories\ActivityRepositoryInterface;
use Academorix\Activity\Data\ActivityData;
use Academorix\Activity\Data\Requests\ListActivitiesRequestData;
use Academorix\Activity\Enums\ActivityPermission;
use Academorix\Activity\Models\Activity;
use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/activities` — tenant-facing activity feed.
 *
 * Regular users see their own causer feed via the policy + query scope;
 * tenant admins see the full tenant-wide feed. The `BelongsToTenant`
 * global scope handles tenant filtering — this action only layers the
 * user-supplied filters on top.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[AsAction(name: 'activity.tenant.list')]
#[Get('/api/v1/activities')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(ActivityPermission::View)]
final class ListActivities
{
    use AsController;

    /**
     * @param  ActivityRepositoryInterface  $activities     Repository seam.
     * @param  TenantContextInterface       $tenantContext  Resolved tenant.
     */
    public function __construct(
        private readonly ActivityRepositoryInterface $activities,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * @return DataCollection<int, ActivityData>
     */
    public function __invoke(ListActivitiesRequestData $filters): DataCollection
    {
        $tenant = $this->tenantContext->currentOrFail();

        $rows = $this->activities
            ->findByTenant((string) $tenant->getKey(), 100)
            ->map(static fn (Activity $a): ActivityData => ActivityData::fromModel($a));

        return new DataCollection(ActivityData::class, $rows);
    }
}
