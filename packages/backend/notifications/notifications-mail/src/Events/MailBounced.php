<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a provider webhook reports a bounce.
 *
 * `bounceKind` is either `'hard'` (permanent — recipient does not
 * exist) or `'soft'` (transient — mailbox full, over quota, DNS
 * timeout). Hard bounces trigger address suppression via
 * {@see \Academorix\Notifications\Mail\Listeners\SuppressAddressListener};
 * soft bounces trigger a retry of the delivery.
 *
 * ## Consumers
 *
 *   - `notifications::UpdateDeliveryFailedListener` — transitions
 *     the delivery to `state = failed` (soft) or
 *     `state = permanently_failed` (hard).
 *   - `notifications-mail::SuppressAddressListener` — adds the
 *     address to the suppression list when hard.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/events.json
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.mail.bounced')]
final readonly class MailBounced implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string             $notificationId  Parent notification id.
     * @param  string             $deliveryId      Delivery row id.
     * @param  string             $provider        Provider slug.
     * @param  string             $bounceKind      `'hard'` or `'soft'`.
     * @param  string             $bounceReason    Sanitised provider bounce reason.
     * @param  string             $recipientEmail  Recipient address.
     * @param  \DateTimeInterface $bouncedAt       Bounce timestamp reported by provider.
     */
    public function __construct(
        public string $notificationId,
        public string $deliveryId,
        public string $provider,
        public string $bounceKind,
        public string $bounceReason,
        public string $recipientEmail,
        public \DateTimeInterface $bouncedAt,
    ) {
    }
}
