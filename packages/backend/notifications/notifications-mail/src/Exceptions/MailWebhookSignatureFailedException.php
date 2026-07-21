<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised by
 * {@see \Stackra\Notifications\Mail\Middleware\VerifyMailWebhookMiddleware}
 * when a provider webhook fails signature verification.
 *
 * Rejected BEFORE the action runs. The exception renders as HTTP
 * 401 with error code `NOTIFICATIONS_MAIL_WEBHOOK_SIGNATURE_INVALID`.
 * Only the signature fragment (first 8 characters) is logged for
 * support — the full signature is provider-secret-derived so we
 * never echo it.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/errors.json
 *   (`NOTIFICATIONS_MAIL_WEBHOOK_SIGNATURE_INVALID`)
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
final class MailWebhookSignatureFailedException extends StackraException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'notifications.mail.webhook_signature_invalid';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'notifications-mail::errors.webhook_signature_invalid';
}
