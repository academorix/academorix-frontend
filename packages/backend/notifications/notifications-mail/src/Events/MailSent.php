<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when {@see \Stackra\Notifications\Mail\Jobs\SendMailJob}
 * has handed the mail to Laravel's `MailManager` without exception
 * and captured the provider's message id (when available).
 *
 * ## Consumers
 *
 *   - `notifications::UpdateDeliverySentListener` — transitions
 *     the `NotificationDelivery` row to `state = sent`.
 *   - `analytics::TrackMailSent` — increments the sent counter for
 *     the transport.
 *
 * Distinct from the parent notifications module's
 * `NotificationDispatched` — that fires for every channel; this
 * one is transport-specific.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/events.json
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.mail.sent')]
final readonly class MailSent implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string       $notificationId     The parent `Notification` id (`not_<ulid>`).
     * @param  string       $deliveryId         The `NotificationDelivery` id.
     * @param  string       $provider           Provider slug (`mailgun`, `ses`, ...).
     * @param  string|null  $providerMessageId  Provider message id if surfaced by the transport.
     * @param  string       $recipientEmail     Recipient address (normalised).
     * @param  string       $subject            Rendered subject line.
     * @param  \DateTimeInterface  $sentAt      Send timestamp.
     */
    public function __construct(
        public string $notificationId,
        public string $deliveryId,
        public string $provider,
        public ?string $providerMessageId,
        public string $recipientEmail,
        public string $subject,
        public \DateTimeInterface $sentAt,
    ) {
    }
}
