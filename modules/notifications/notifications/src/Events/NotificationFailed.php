<?php

declare(strict_types=1);

namespace Academorix\Notifications\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Notifications\Models\Notification;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a channel module exhausted retries OR received a
 * hard-failure signal (hard bounce, unsubscribed, invalid token).
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.notification.failed')]
final readonly class NotificationFailed implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Notification  $notification  The failed notification.
     */
    public function __construct(public Notification $notification)
    {
    }
}
