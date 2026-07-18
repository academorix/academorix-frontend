<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Exceptions;

use Academorix\Exceptions\AcademorixException;

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
final class PushProviderDisabledException extends AcademorixException
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
