<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a push provider is unknown, disabled, or misconfigured.
 *
 * The dispatch job catches this and marks the delivery as retryable — the
 * provider might come back online.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
final class PushProviderDisabledException extends Exception
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const string CODE = 'notifications-push.provider_disabled';

    /**
     * Translation key for the humanised message.
     */
    public const string TRANSLATION_KEY = 'notifications-push::errors.provider_disabled';
}
