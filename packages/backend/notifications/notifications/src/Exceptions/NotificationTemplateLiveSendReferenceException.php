<?php

declare(strict_types=1);

namespace Academorix\Notifications\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when an admin attempts to delete a `NotificationTemplate`
 * that is referenced by live (non-terminal-state) `Notification`
 * rows.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationTemplateLiveSendReferenceException extends AcademorixException
{
    public const CODE = 'NOTIFICATIONS_TEMPLATE_LIVE_SEND_REFERENCE';

    public const TRANSLATION_KEY = 'notifications::errors.template_live_send_reference';
}
