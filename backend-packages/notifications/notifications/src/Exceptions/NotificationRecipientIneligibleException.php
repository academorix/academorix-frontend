<?php

declare(strict_types=1);

namespace Academorix\Notifications\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the recipient's consent age gate blocks the category
 * (e.g. marketing to a minor).
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationRecipientIneligibleException extends AcademorixException
{
    public const CODE = 'NOTIFICATIONS_RECIPIENT_INELIGIBLE';

    public const TRANSLATION_KEY = 'notifications::errors.recipient_ineligible';
}
