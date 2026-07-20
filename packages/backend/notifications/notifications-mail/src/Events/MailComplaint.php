<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a provider webhook reports a spam / abuse
 * complaint (feedback loop / user-marked-as-spam).
 *
 * Always suppresses the recipient — the suppression row is retained
 * P5Y for CAN-SPAM + CASL evidence per
 * `modules/notifications/blueprints/notifications-mail/retention.json`.
 *
 * ## Consumers
 *
 *   - `notifications::UpdateDeliveryFailedListener` — transitions
 *     the delivery to `state = permanently_failed`.
 *   - `notifications-mail::SuppressAddressListener` — adds the
 *     address to the suppression list with `reason=complaint`.
 *   - `compliance::AuditComplaintListener` — writes a compliance
 *     audit row.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/events.json
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.mail.complaint')]
final readonly class MailComplaint implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string             $notificationId  Parent notification id.
     * @param  string             $deliveryId      Delivery row id.
     * @param  string             $provider        Provider slug.
     * @param  string             $recipientEmail  Recipient address.
     * @param  \DateTimeInterface $complainedAt    Complaint timestamp reported by provider.
     */
    public function __construct(
        public string $notificationId,
        public string $deliveryId,
        public string $provider,
        public string $recipientEmail,
        public \DateTimeInterface $complainedAt,
    ) {
    }
}
