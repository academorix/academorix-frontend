<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a push payload exceeds the provider's byte limit (FCM 4KB /
 * APNs 4KB standard / APNs 5KB VoIP).
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
final class PayloadTooLargeException extends Exception
{
    public const string CODE = 'notifications-push.payload_too_large';

    public const string TRANSLATION_KEY = 'notifications-push::errors.payload_too_large';
}
