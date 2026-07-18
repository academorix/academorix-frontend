<?php

declare(strict_types=1);

namespace Academorix\Notifications\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Notifications\Models\Notification;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Notification row is created and ready for
 * channel-module handoff.
 *
 * Fired from `NotificationObserver::created()` wrapped in
 * `ShouldDispatchAfterCommit` so channel modules never see a row
 * that was rolled back.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.notification.dispatched')]
final readonly class NotificationDispatched implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Notification  $notification  The persisted notification.
     */
    public function __construct(public Notification $notification)
    {
    }
}
