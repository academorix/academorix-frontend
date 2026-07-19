<?php

declare(strict_types=1);

namespace Academorix\Notifications\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Data\NotificationDeliveryData;
use Academorix\Notifications\Enums\NotificationsPermission;
use Academorix\Notifications\Models\Notification;
use Academorix\Notifications\Models\NotificationDelivery;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /api/v1/platform/notifications/{notification}/deliveries/{delivery}/retry`
 * — platform-admin manual retry of a failed delivery.
 *
 * Rate-limited by the enclosing throttle middleware.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.platform.deliveries.retry')]
#[Post('/api/v1/platform/notifications/{notification}/deliveries/{delivery}/retry')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:5,60'])]
#[WhereUlid('notification')]
#[WhereUlid('delivery')]
#[RequirePermission(NotificationsPermission::PlatformRetry)]
final class RetryDelivery
{
    use AsController;

    public function __invoke(Notification $notification, NotificationDelivery $delivery): NotificationDeliveryData
    {
        // Enqueue the retry through the channel module's SendJob. The
        // actual dispatch to the queue lives in a follow-up slice —
        // the action here surfaces the intent.
        return NotificationDeliveryData::fromModel($delivery);
    }
}
