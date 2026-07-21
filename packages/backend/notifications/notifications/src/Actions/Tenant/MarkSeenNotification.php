<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Contracts\Data\NotificationInterface;
use Stackra\Notifications\Data\NotificationData;
use Stackra\Notifications\Data\Requests\MarkSeenRequestData;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\Models\Notification;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;

/**
 * `POST /api/v1/tenant/notifications/{notification}/seen` — mark a
 * single notification as seen.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.tenant.mark-seen')]
#[Post('/api/v1/tenant/notifications/{notification}/seen')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle.mark-seen'])]
#[WhereUlid('notification')]
#[RequirePermission(NotificationsPermission::MarkSeen)]
final class MarkSeenNotification
{
    use AsController;

    public function __invoke(Notification $notification, MarkSeenRequestData $data): NotificationData
    {
        if ($notification->{NotificationInterface::ATTR_SEEN_AT} === null) {
            $notification->{NotificationInterface::ATTR_SEEN_AT} = \now();
            $notification->save();
        }

        return NotificationData::fromModel($notification);
    }
}
