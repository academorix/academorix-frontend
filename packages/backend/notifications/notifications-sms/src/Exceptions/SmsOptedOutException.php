<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised inside SendSmsJob when the recipient is opted out.
 *
 * Not surfaced as a caller error — the delivery is marked
 * `permanently_failed` with error code `OPTED_OUT` and the notifications
 * core continues with other channels.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
final class SmsOptedOutException extends Exception
{
    public const string CODE = 'notifications-sms.opted_out';

    public const string TRANSLATION_KEY = 'notifications-sms::errors.opted_out';
}
