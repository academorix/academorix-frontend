<?php

declare(strict_types=1);

namespace Academorix\Notifications\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Notifications\Models\NotificationDelivery;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a NotificationDelivery row is created (queued for send).
 *
 * Observability signal only — consumers use this for metrics; the
 * dispatch itself is driven by `NotificationDispatched`.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.notification.queued')]
final readonly class NotificationQueued implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  NotificationDelivery  $delivery  The freshly-created delivery row.
     */
    public function __construct(public NotificationDelivery $delivery)
    {
    }
}
