<?php

declare(strict_types=1);

namespace Stackra\Notifications\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when the dispatch payload fails the category's declared
 * variable schema.
 *
 * Indicates a code bug in the caller.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationDispatchInvalidPayloadException extends StackraException
{
    public const CODE = 'NOTIFICATIONS_DISPATCH_INVALID_PAYLOAD';

    public const TRANSLATION_KEY = 'notifications::errors.dispatch_invalid_payload';
}
