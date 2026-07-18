<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a caller attempts to confirm a subscription that has
 * already transitioned to `active`. Renders as HTTP 409.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class SubscriberAlreadyConfirmedException extends AcademorixException
{
    public const CODE = 'newsletter.already_confirmed';

    public const TRANSLATION_KEY = 'newsletter::errors.already_confirmed';
}
