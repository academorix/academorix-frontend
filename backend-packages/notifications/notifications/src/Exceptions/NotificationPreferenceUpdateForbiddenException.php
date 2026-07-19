<?php

declare(strict_types=1);

namespace Academorix\Notifications\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a user attempts to set `enabled=false` on a category
 * where `opt_out_allowed=false` (transactional_required).
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationPreferenceUpdateForbiddenException extends AcademorixException
{
    public const CODE = 'NOTIFICATIONS_PREFERENCE_UPDATE_FORBIDDEN';

    public const TRANSLATION_KEY = 'notifications::errors.preference_update_forbidden';
}
