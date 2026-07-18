<?php

declare(strict_types=1);

namespace Academorix\Notifications\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Notifications\Models\Notification;
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
