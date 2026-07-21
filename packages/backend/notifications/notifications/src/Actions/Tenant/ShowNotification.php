<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Data\NotificationData;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\Models\Notification;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;

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
