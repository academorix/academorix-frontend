<?php

declare(strict_types=1);

namespace Academorix\Activity\Actions\Platform;

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
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/activities` — platform-admin cross-tenant
 * activity feed for support incident triage.
 *
 * The `BelongsToTenant` global scope MUST be bypassed on this path —
 * platform admins are cross-tenant by definition. The
 * `auth:platform_admin` guard + `ViewAll` permission gate the
 * bypass.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[AsAction(name: 'activity.platform.list')]
#[Get('/api/v1/platform/activities')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(ActivityPermission::ViewAll)]
final class ListActivities
{
    use AsController;

    /**
     * @param  ActivityRepositoryInterface  $activities  Repository seam.
     */
    public function __construct(
        private readonly ActivityRepositoryInterface $activities,
    ) {
    }

    /**
     * @return DataCollection<int, ActivityData>
     */
    public function __invoke(ListActivitiesRequestData $filters): DataCollection
    {
        // Pagination on the paginated base — platform admins iterate
        // through the full corpus rather than the recent-100 window
        // the tenant feed uses.
        $rows = $this->activities
            ->paginate()
            ->getCollection()
            ->map(static fn (Activity $a): ActivityData => ActivityData::fromModel($a));

        return new DataCollection(ActivityData::class, $rows);
    }
}
