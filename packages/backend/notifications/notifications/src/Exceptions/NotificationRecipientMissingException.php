<?php

declare(strict_types=1);

namespace Stackra\Notifications\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when the dispatch call did not provide a recipient and one
 * could not be inferred (e.g. dispatched from a queue job with no
 * auth context).
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationRecipientMissingException extends Exception
{
    public const CODE = 'NOTIFICATIONS_RECIPIENT_MISSING';

    public const TRANSLATION_KEY = 'notifications::errors.recipient_missing';
}
