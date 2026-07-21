<?php

declare(strict_types=1);

namespace Stackra\Notifications\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a tenant has exceeded its per-channel monthly cap
 * and the dispatch cannot proceed on that channel.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationQuotaExceededException extends Exception
{
    public const CODE = 'NOTIFICATIONS_QUOTA_EXCEEDED';

    public const TRANSLATION_KEY = 'notifications::errors.quota_exceeded';
}
