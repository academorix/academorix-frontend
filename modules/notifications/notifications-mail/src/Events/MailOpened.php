<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a provider webhook reports that the tracking
 * pixel on the message was loaded.
 *
 * ## Consumers
 *
 *   - `notifications::UpdateDeliveryOpenedListener` — updates
 *     `NotificationDelivery.opened_at`.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/events.json
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.mail.opened')]
final readonly class MailOpened implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string             $notificationId  Parent notification id.
     * @param  string             $deliveryId      Delivery row id.
     * @param  string             $provider        Provider slug.
     * @param  \DateTimeInterface $openedAt        Open timestamp reported by provider.
     * @param  string|null        $openedIp        IP that loaded the pixel (may be provider-anonymised).
     * @param  string|null        $userAgent       User-Agent string from the open event.
     */
    public function __construct(
        public string $notificationId,
        public string $deliveryId,
        public string $provider,
        public \DateTimeInterface $openedAt,
        public ?string $openedIp = null,
        public ?string $userAgent = null,
    ) {
    }
}
