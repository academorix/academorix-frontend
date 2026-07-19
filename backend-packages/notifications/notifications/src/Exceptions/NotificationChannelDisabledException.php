<?php

declare(strict_types=1);

namespace Academorix\Notifications\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a channel module reports itself disabled via kill
 * switch or feature flag at dispatch time.
 *
 * The dispatch gateway catches this and continues with the remaining
 * channels — not a fatal error.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationChannelDisabledException extends AcademorixException
{
    public const CODE = 'NOTIFICATIONS_CHANNEL_DISABLED';

    public const TRANSLATION_KEY = 'notifications::errors.channel_disabled';
}
