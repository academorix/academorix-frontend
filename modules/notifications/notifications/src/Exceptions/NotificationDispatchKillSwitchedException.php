<?php

declare(strict_types=1);

namespace Academorix\Notifications\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the `notifications.enabled` kill switch is off and a
 * caller tried to dispatch.
 *
 * Retry-After header is set by the exception renderer based on the
 * incident-response ETA.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationDispatchKillSwitchedException extends AcademorixException
{
    public const CODE = 'NOTIFICATIONS_DISPATCH_KILL_SWITCHED';

    public const TRANSLATION_KEY = 'notifications::errors.dispatch_kill_switched';
}
