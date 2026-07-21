<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a provider webhook reports the message was
 * accepted by the recipient's MTA.
 *
 * ## Consumers
 *
 *   - `notifications::UpdateDeliveryDeliveredListener` —
 *     transitions the `NotificationDelivery` row to
 *     `state = delivered`.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/events.json
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.mail.delivered')]
final readonly class MailDelivered implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string             $notificationId     Parent notification id.
     * @param  string             $deliveryId         Delivery row id.
     * @param  string             $provider           Provider slug.
     * @param  string             $providerMessageId  Provider message id (correlation key).
     * @param  \DateTimeInterface $deliveredAt        Delivery timestamp reported by provider.
     */
    public function __construct(
        public string $notificationId,
        public string $deliveryId,
        public string $provider,
        public string $providerMessageId,
        public \DateTimeInterface $deliveredAt,
    ) {
    }
}
