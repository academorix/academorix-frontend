<?php

declare(strict_types=1);

namespace Stackra\Notifications\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when the recipient's consent age gate blocks the category
 * (e.g. marketing to a minor).
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationRecipientIneligibleException extends StackraException
{
    public const CODE = 'NOTIFICATIONS_RECIPIENT_INELIGIBLE';

    public const TRANSLATION_KEY = 'notifications::errors.recipient_ineligible';
}
