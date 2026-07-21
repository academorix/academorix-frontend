<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a device token fails validation on the provider.
 *
 * The observer catches this on `creating` and refuses to persist the row —
 * the caller receives 422 with translation key
 * `notifications-push.errors.token_validation_failed`.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
final class InvalidDeviceTokenException extends StackraException
{
    public const string CODE = 'notifications-push.token_validation_failed';

    public const string TRANSLATION_KEY = 'notifications-push::errors.token_validation_failed';
}
