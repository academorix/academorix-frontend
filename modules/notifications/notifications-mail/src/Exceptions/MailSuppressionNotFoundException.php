<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a tenant admin surface references a suppression id
 * that does not exist or is not visible to the caller. Returns
 * HTTP 404 rather than 403 to avoid enumeration.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
final class MailSuppressionNotFoundException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'notifications.mail.suppression_not_found';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'notifications-mail::errors.suppression_not_found';
}
