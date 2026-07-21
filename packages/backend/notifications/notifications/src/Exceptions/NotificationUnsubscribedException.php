<?php

declare(strict_types=1);

namespace Stackra\Notifications\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised internally when a recipient has opted out of an opt-out-
 * allowed category on the target channel.
 *
 * NOT surfaced as an error to callers — dispatch returns success
 * with the delivery marked suppressed. Logged for audit trail.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationUnsubscribedException extends Exception
{
    public const CODE = 'NOTIFICATIONS_UNSUBSCRIBED';

    public const TRANSLATION_KEY = 'notifications::errors.unsubscribed';
}
