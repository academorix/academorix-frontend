<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when an SMS provider is unknown or disabled.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
final class SmsProviderDisabledException extends StackraException
{
    public const string CODE = 'notifications-sms.provider_disabled';

    public const string TRANSLATION_KEY = 'notifications-sms::errors.provider_disabled';
}
