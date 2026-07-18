<?php

declare(strict_types=1);

namespace Academorix\Notifications\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a lookup expects a Notification row but none is
 * visible — either the row doesn't exist, was pruned past retention,
 * or belongs to a different tenant (returned as 404 rather than 403
 * to avoid cross-tenant enumeration).
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationNotFoundException extends AcademorixException
{
    public const CODE = 'notifications.not_found';

    public const TRANSLATION_KEY = 'notifications::errors.not_found';
}
