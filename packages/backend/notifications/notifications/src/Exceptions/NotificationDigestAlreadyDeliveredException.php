<?php

declare(strict_types=1);

namespace Stackra\Notifications\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when `ProcessDigestJob` raced with an idempotent duplicate
 * and detected a delivered digest for the same window.
 *
 * Job noops.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationDigestAlreadyDeliveredException extends Exception
{
    public const CODE = 'NOTIFICATIONS_DIGEST_ALREADY_DELIVERED';

    public const TRANSLATION_KEY = 'notifications::errors.digest_already_delivered';
}
