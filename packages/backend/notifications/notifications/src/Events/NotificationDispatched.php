<?php

declare(strict_types=1);

namespace Stackra\Notifications\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Notifications\Models\Notification;
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
