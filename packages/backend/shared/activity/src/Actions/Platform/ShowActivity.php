<?php

declare(strict_types=1);

namespace Stackra\Activity\Actions\Platform;

use Stackra\Activity\Data\ActivityData;
use Stackra\Activity\Enums\ActivityPermission;
use Stackra\Activity\Models\Activity;
use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;

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
