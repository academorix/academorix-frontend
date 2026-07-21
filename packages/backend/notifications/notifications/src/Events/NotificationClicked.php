<?php

declare(strict_types=1);

namespace Stackra\Notifications\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Notifications\Models\NotificationDelivery;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when the user clicked a tracked link inside a delivered
 * notification.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.notification.clicked')]
final readonly class NotificationClicked implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  NotificationDelivery  $delivery  Delivery row that recorded the click.
     */
    public function __construct(public NotificationDelivery $delivery)
    {
    }
}
