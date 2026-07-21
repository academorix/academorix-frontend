<?php

declare(strict_types=1);

namespace Stackra\Notifications\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Notifications\Models\Notification;
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
