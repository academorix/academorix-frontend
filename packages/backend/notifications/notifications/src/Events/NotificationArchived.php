<?php

declare(strict_types=1);

namespace Stackra\Notifications\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Notifications\Models\Notification;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when the user archives a notification from the inbox.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.notification.archived')]
final readonly class NotificationArchived implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Notification  $notification  The notification archived.
     */
    public function __construct(public Notification $notification)
    {
    }
}
