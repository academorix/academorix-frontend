<?php

declare(strict_types=1);

namespace Academorix\Notifications\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the tenant is in a suspended state — dispatch is
 * queued but not delivered.
 *
 * Retryable when the tenant unsuspends.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationTenantSuspendedException extends AcademorixException
{
    public const CODE = 'NOTIFICATIONS_TENANT_SUSPENDED';

    public const TRANSLATION_KEY = 'notifications::errors.tenant_suspended';
}
