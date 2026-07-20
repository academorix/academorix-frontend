<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Exceptions;

use Academorix\Exceptions\AcademorixException;

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
final class InvalidDeviceTokenException extends AcademorixException
{
    public const string CODE = 'notifications-push.token_validation_failed';

    public const string TRANSLATION_KEY = 'notifications-push::errors.token_validation_failed';
}
