<?php

declare(strict_types=1);

namespace Stackra\Notifications\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a template body fails Blade validation on publish OR
 * references a missing variable at send time.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationTemplateInvalidException extends StackraException
{
    public const CODE = 'NOTIFICATIONS_TEMPLATE_INVALID';

    public const TRANSLATION_KEY = 'notifications::errors.template_invalid';
}
