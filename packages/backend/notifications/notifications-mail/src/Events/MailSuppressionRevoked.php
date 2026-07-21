<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a suppression is revoked — either via admin
 * action, super_admin override on a hard-bounce row, or the daily
 * pruner sweeping an expired soft-bounce entry.
 *
 * ## Consumers
 *
 *   - `notifications-mail::SuppressionCacheInvalidator` — flushes
 *     the send-path suppression cache so subsequent sends see the
 *     revocation immediately.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/events.json
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.mail.suppression.revoked')]
final readonly class MailSuppressionRevoked implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string       $suppressionId    Persisted `MailSuppression` id.
     * @param  string|null  $tenantId         Tenant that owned the row, or NULL for platform-wide.
     * @param  string       $email            Address that was suppressed (normalised).
     * @param  string|null  $revokedByUserId  Actor id (admin / super_admin), or NULL for auto-expiry.
     */
    public function __construct(
        public string $suppressionId,
        public ?string $tenantId,
        public string $email,
        public ?string $revokedByUserId = null,
    ) {
    }
}
