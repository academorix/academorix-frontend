<?php

declare(strict_types=1);

namespace Academorix\Notifications\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Contracts\Repositories\NotificationRepositoryInterface;
use Academorix\Notifications\Data\NotificationData;
use Academorix\Notifications\Enums\NotificationsPermission;
use Academorix\Notifications\Models\Notification;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/notifications` — platform-admin cross-tenant
 * notification search for support / abuse investigation.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.platform.list')]
#[Get('/api/v1/platform/notifications')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(NotificationsPermission::PlatformViewAny)]
final class ListNotifications
{
    use AsController;

    public function __construct(
        private readonly NotificationRepositoryInterface $notifications,
    ) {
    }

    /**
     * @return DataCollection<int, NotificationData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->notifications
            ->paginate()
            ->getCollection()
            ->map(static fn (Notification $n): NotificationData => NotificationData::fromModel($n));

        return new DataCollection(NotificationData::class, $rows);
    }
}
