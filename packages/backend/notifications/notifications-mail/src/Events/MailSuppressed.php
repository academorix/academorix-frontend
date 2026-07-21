<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a new address is added to the mail suppression
 * list — either via a hard-bounce / complaint webhook path, an
 * admin manual add, or the seeder for spam-trap rows.
 *
 * ## Consumers
 *
 *   - `notifications-mail::SuppressionCacheInvalidator` — flushes
 *     the send-path suppression cache for the recipient's tenant.
 *   - `compliance::AuditSuppressionListener` — writes an audit row
 *     naming the source (`webhook` / `admin` / `seed`).
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/events.json
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.mail.suppressed')]
final readonly class MailSuppressed implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string       $suppressionId  Persisted `MailSuppression` id (`msp_<ulid>`).
     * @param  string|null  $tenantId       Tenant that owns the row, or NULL for platform-wide.
     * @param  string       $email          Suppressed address (normalised).
     * @param  string       $reason         `MailSuppressionReason` backing value.
     * @param  string       $source         `'webhook'` / `'admin'` / `'seed'`.
     */
    public function __construct(
        public string $suppressionId,
        public ?string $tenantId,
        public string $email,
        public string $reason,
        public string $source,
    ) {
    }
}
