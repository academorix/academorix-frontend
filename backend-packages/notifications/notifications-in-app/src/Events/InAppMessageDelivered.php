<?php

declare(strict_types=1);

namespace Academorix\Notifications\InApp\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when an InAppMessage row is persisted and the driver
 * has enqueued the Reverb broadcast.
 *
 * Fires from
 * {@see \Academorix\Notifications\InApp\Channels\InAppChannel::deliver()}
 * exactly once per delivery. Distinct from the parent notifications
 * module's `NotificationDispatched` — that fires for every channel,
 * this one is transport-specific.
 *
 * ## Consumers
 *   - `notifications-in-app::UpdateUnreadCountCache` — invalidates
 *     the badge count cache for the addressee.
 *   - `analytics::TrackInAppDelivery` — increments the delivery
 *     metric for the transport.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-in-app/events.json
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.in-app.delivered')]
final readonly class InAppMessageDelivered
{
    use Dispatchable;

    /**
     * @param  string  $inAppMessageId  The persisted `InAppMessage` id (`iam_<ulid>`).
     * @param  string  $tenantId        Active tenant.
     * @param  string  $addresseeId     Recipient user id.
     */
    public function __construct(
        public string $inAppMessageId,
        public string $tenantId,
        public string $addresseeId,
    ) {
    }
}
