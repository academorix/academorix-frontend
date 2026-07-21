<?php

declare(strict_types=1);

namespace Stackra\Notifications\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Notifications\Models\NotificationDelivery;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when the tracking pixel loads (mail), the user views
 * in-app, OR a system open event fires (push).
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.notification.opened')]
final readonly class NotificationOpened implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  NotificationDelivery  $delivery  Delivery row that recorded the open.
     */
    public function __construct(public NotificationDelivery $delivery)
    {
    }
}
