<?php

declare(strict_types=1);

namespace Academorix\Activity\Actions\Platform;

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
 * `GET /api/v1/platform/activities/{activity}` — platform-admin
 * cross-tenant activity row read.
 *
 * The route resolves the row across every tenant — `BelongsToTenant`'s
 * global scope is not applied on platform routes, so any tenant's
 * row is reachable to a caller carrying `ViewAll`.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[AsAction(name: 'activity.platform.show')]
#[Get('/api/v1/platform/activities/{activity}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('activity')]
#[RequirePermission(ActivityPermission::ViewAll)]
final class ShowActivity
{
    use AsController;

    public function __invoke(Activity $activity): ActivityData
    {
        return ActivityData::fromModel($activity);
    }
}
