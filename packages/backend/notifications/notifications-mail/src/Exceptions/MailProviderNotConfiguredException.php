<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a send resolves a mailer that isn't defined in
 * Laravel's `config/mail.php` — usually a `categories.<slug>.mailer`
 * config referencing a mailer that was later removed.
 *
 * Non-retryable — retrying the same undefined mailer produces the
 * same failure. Operators fix the misconfiguration in Doppler /
 * `config/mail.php` and re-dispatch.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/errors.json
 *   (`NOTIFICATIONS_MAIL_PROVIDER_DISABLED`)
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
final class MailProviderNotConfiguredException extends StackraException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'notifications.mail.provider_disabled';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'notifications-mail::errors.provider_disabled';
}
