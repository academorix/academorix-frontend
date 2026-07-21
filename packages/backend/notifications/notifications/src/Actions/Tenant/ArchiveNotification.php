<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Contracts\Data\NotificationInterface;
use Stackra\Notifications\Data\NotificationData;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\Models\Notification;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;

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
