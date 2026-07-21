<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Data\NotificationDeliveryData;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\Models\Notification;
use Stackra\Notifications\Models\NotificationDelivery;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;

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
