<?php

declare(strict_types=1);

namespace Stackra\Notifications\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Notifications\Models\Notification;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a channel module handed off the notification to
 * its provider AND received a synchronous accept.
 *
 * Not the same as `NotificationDelivered` — a bounce may still
 * arrive later.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.notification.sent')]
final readonly class NotificationSent implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Notification  $notification  The notification that was sent.
     */
    public function __construct(public Notification $notification)
    {
    }
}
