<?php

declare(strict_types=1);

namespace Academorix\Activity\Actions\Tenant;

use Academorix\Activity\Data\ActivityData;
use Academorix\Activity\Enums\ActivityPermission;
use Academorix\Activity\Models\Activity;
use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/activities/{activity}` — read one activity row scoped
 * to the caller's tenant.
 *
 * `BelongsToTenant` scopes the model-binding lookup automatically —
 * a row belonging to a different tenant will 404 rather than 403,
 * mirroring the cross-tenant enumeration-safe behaviour of every
 * other tenant-scoped read.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[AsAction(name: 'activity.tenant.show')]
#[Get('/api/v1/activities/{activity}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('activity')]
#[RequirePermission(ActivityPermission::View)]
final class ShowActivity
{
    use AsController;

    /**
     * The route-model-bound `Activity` — already tenant-scoped via
     * `BelongsToTenant`'s global scope.
     */
    public function __invoke(Activity $activity): ActivityData
    {
        return ActivityData::fromModel($activity);
    }
}
