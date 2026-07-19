<?php

declare(strict_types=1);

namespace Academorix\Notifications\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Data\NotificationData;
use Academorix\Notifications\Enums\NotificationsPermission;
use Academorix\Notifications\Models\Notification;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/tenant/notifications/{notification}` — read one row
 * scoped to the caller's tenant.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.tenant.show')]
#[Get('/api/v1/tenant/notifications/{notification}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('notification')]
#[RequirePermission(NotificationsPermission::View)]
final class ShowNotification
{
    use AsController;

    public function __invoke(Notification $notification): NotificationData
    {
        return NotificationData::fromModel($notification);
    }
}
