<?php

declare(strict_types=1);

namespace Stackra\Notifications\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a signed unsubscribe token fails verification or has
 * expired.
 *
 * The user's existing preference row is not touched — a bad link
 * does not re-subscribe them.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationUnsubscribeTokenInvalidException extends StackraException
{
    public const CODE = 'NOTIFICATIONS_UNSUBSCRIBE_TOKEN_INVALID';

    public const TRANSLATION_KEY = 'notifications::errors.unsubscribe_token_invalid';
}
