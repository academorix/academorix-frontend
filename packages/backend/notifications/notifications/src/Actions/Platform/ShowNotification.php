<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Platform;

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
 * `GET /api/v1/platform/notifications/{notification}` — platform-
 * admin cross-tenant single-notification view.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.platform.show')]
#[Get('/api/v1/platform/notifications/{notification}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('notification')]
#[RequirePermission(NotificationsPermission::PlatformView)]
final class ShowNotification
{
    use AsController;

    public function __invoke(Notification $notification): NotificationData
    {
        return NotificationData::fromModel($notification);
    }
}
