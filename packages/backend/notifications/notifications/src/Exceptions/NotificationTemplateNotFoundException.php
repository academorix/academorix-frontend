<?php

declare(strict_types=1);

namespace Stackra\Notifications\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when the template resolver could not locate a template for
 * a `(category, channel, locale)` tuple.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationTemplateNotFoundException extends Exception
{
    public const CODE = 'NOTIFICATIONS_TEMPLATE_NOT_FOUND';

    public const TRANSLATION_KEY = 'notifications::errors.template_not_found';
}
