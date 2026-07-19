<?php

declare(strict_types=1);

namespace Academorix\Notifications\Exceptions;

use Academorix\Exceptions\AcademorixException;

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
final class NotificationDigestAlreadyDeliveredException extends AcademorixException
{
    public const CODE = 'NOTIFICATIONS_DIGEST_ALREADY_DELIVERED';

    public const TRANSLATION_KEY = 'notifications::errors.digest_already_delivered';
}
