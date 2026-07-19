<?php

declare(strict_types=1);

namespace Academorix\Notifications\Actions\Platform;

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
