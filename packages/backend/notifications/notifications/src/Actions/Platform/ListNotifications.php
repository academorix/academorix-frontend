<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Contracts\Repositories\NotificationRepositoryInterface;
use Stackra\Notifications\Data\NotificationData;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\Models\Notification;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
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
