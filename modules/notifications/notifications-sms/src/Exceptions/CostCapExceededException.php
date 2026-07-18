<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when sending would push the tenant over its monthly SMS cost cap.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
final class CostCapExceededException extends AcademorixException
{
    public const string CODE = 'notifications-sms.cost_cap_exceeded';

    public const string TRANSLATION_KEY = 'notifications-sms::errors.cost_cap_exceeded';
}
