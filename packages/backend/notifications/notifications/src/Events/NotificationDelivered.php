<?php

declare(strict_types=1);

namespace Stackra\Notifications\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Notifications\Models\Notification;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a provider webhook confirms endpoint delivery.
 *
 * Emitted from the channel module's IngestProviderWebhookJob;
 * downstream consumers reconcile their own state.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.notification.delivered')]
final readonly class NotificationDelivered implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Notification  $notification  The delivered notification.
     */
    public function __construct(public Notification $notification)
    {
    }
}
