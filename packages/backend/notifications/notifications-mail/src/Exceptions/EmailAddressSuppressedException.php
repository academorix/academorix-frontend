<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a send is attempted against an address on the mail
 * suppression list.
 *
 * Not thrown from the channel driver itself — the driver returns
 * `null` so the outer job records `permanently_failed` cleanly.
 * This exception exists for callers that WANT the address-suppressed
 * case to surface as a raise (e.g. an admin action manually
 * triggering a re-send against a hard-bounced address).
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/errors.json
 *   (`NOTIFICATIONS_MAIL_SUPPRESSED_ADDRESS`)
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
final class EmailAddressSuppressedException extends Exception
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'notifications.mail.suppressed_address';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'notifications-mail::errors.suppressed_address';
}
