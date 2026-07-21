<?php

declare(strict_types=1);

namespace Stackra\Notifications\InApp\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a
 * {@see \Stackra\Notifications\InApp\Models\InAppMessageRead}
 * transitions its `read_at` column from `null` to non-null. Fires
 * exactly once per delivery (idempotent — subsequent mark-read
 * attempts do NOT re-fire).
 *
 * ## Consumers
 *   - `notifications-in-app::UpdateUnreadCountCache` — decrements
 *     the badge count cache for the addressee.
 *   - `activity::WriteToActivityLog` — records a read event when
 *     the category priority is `marketing`.
 *
 * `ShouldDispatchAfterCommit` — the mark-read repository writes
 * inside a transaction; consumers never observe a row that was
 * rolled back.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-in-app/events.json
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.in-app.read')]
final readonly class InAppMessageRead implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string              $inAppMessageId  The persisted `InAppMessage` id.
     * @param  string              $tenantId        Active tenant.
     * @param  string              $addresseeId     Reader id.
     * @param  \DateTimeInterface  $readAt          When the read transition occurred.
     */
    public function __construct(
        public string $inAppMessageId,
        public string $tenantId,
        public string $addresseeId,
        public \DateTimeInterface $readAt,
    ) {
    }
}
