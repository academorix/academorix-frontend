<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Contracts\Repositories\NotificationDeliveryRepositoryInterface;
use Stackra\Notifications\Data\NotificationDeliveryData;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\Models\Notification;
use Stackra\Notifications\Models\NotificationDelivery;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
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
