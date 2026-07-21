<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a provider webhook reports a click on a tracked
 * link in the message.
 *
 * `clickedUrl` may be hashed for URLs the provider classifies as
 * restricted (unsubscribe link, sensitive redirects) — consumers
 * treat it as an opaque correlation string.
 *
 * ## Consumers
 *
 *   - `notifications::UpdateDeliveryClickedListener` — updates
 *     `NotificationDelivery.last_click_at`.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/events.json
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.mail.clicked')]
final readonly class MailClicked implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string             $notificationId  Parent notification id.
     * @param  string             $deliveryId      Delivery row id.
     * @param  string             $provider        Provider slug.
     * @param  string             $clickedUrl      Clicked URL — hashed for restricted links.
     * @param  \DateTimeInterface $clickedAt       Click timestamp reported by provider.
     */
    public function __construct(
        public string $notificationId,
        public string $deliveryId,
        public string $provider,
        public string $clickedUrl,
        public \DateTimeInterface $clickedAt,
    ) {
    }
}
