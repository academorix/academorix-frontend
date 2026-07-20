<?php

declare(strict_types=1);

namespace Academorix\Notifications\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Contracts\Data\NotificationInterface;
use Academorix\Notifications\Data\NotificationData;
use Academorix\Notifications\Enums\NotificationsPermission;
use Academorix\Notifications\Models\Notification;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /api/v1/tenant/notifications/{notification}/archive` —
 * archive a notification from the inbox.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.tenant.archive')]
#[Post('/api/v1/tenant/notifications/{notification}/archive')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('notification')]
#[RequirePermission(NotificationsPermission::Archive)]
final class ArchiveNotification
{
    use AsController;

    public function __invoke(Notification $notification): NotificationData
    {
        if ($notification->{NotificationInterface::ATTR_ARCHIVED_AT} === null) {
            $notification->{NotificationInterface::ATTR_ARCHIVED_AT} = \now();
            $notification->save();
        }

        return NotificationData::fromModel($notification);
    }
}
