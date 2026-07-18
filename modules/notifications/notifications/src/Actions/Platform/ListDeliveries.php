<?php

declare(strict_types=1);

namespace Academorix\Notifications\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Contracts\Repositories\NotificationDeliveryRepositoryInterface;
use Academorix\Notifications\Data\NotificationDeliveryData;
use Academorix\Notifications\Enums\NotificationsPermission;
use Academorix\Notifications\Models\Notification;
use Academorix\Notifications\Models\NotificationDelivery;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/notifications/{notification}/deliveries` —
 * list every per-channel attempt for one notification.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.platform.deliveries.list')]
#[Get('/api/v1/platform/notifications/{notification}/deliveries')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('notification')]
#[RequirePermission(NotificationsPermission::PlatformView)]
final class ListDeliveries
{
    use AsController;

    public function __construct(
        private readonly NotificationDeliveryRepositoryInterface $deliveries,
    ) {
    }

    /**
     * @return DataCollection<int, NotificationDeliveryData>
     */
    public function __invoke(Notification $notification): DataCollection
    {
        $rows = $this->deliveries
            ->findByNotification((string) $notification->getKey())
            ->map(static fn (NotificationDelivery $d): NotificationDeliveryData => NotificationDeliveryData::fromModel($d));

        return new DataCollection(NotificationDeliveryData::class, $rows);
    }
}
