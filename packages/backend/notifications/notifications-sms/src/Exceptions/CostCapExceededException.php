<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when sending would push the tenant over its monthly SMS cost cap.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
final class CostCapExceededException extends Exception
{
    public const string CODE = 'notifications-sms.cost_cap_exceeded';

    public const string TRANSLATION_KEY = 'notifications-sms::errors.cost_cap_exceeded';
}
