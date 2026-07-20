<?php

declare(strict_types=1);

namespace Academorix\Notifications\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a caller dispatched a category slug that is not
 * present in the category registry.
 *
 * Almost always a code bug (typo or missing notifications.json).
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationCategoryNotRegisteredException extends AcademorixException
{
    public const CODE = 'NOTIFICATIONS_CATEGORY_NOT_REGISTERED';

    public const TRANSLATION_KEY = 'notifications::errors.category_not_registered';
}
