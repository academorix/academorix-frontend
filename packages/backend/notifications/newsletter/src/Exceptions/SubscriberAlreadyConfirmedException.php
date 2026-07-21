<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a caller attempts to confirm a subscription that has
 * already transitioned to `active`. Renders as HTTP 409.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class SubscriberAlreadyConfirmedException extends StackraException
{
    public const CODE = 'newsletter.already_confirmed';

    public const TRANSLATION_KEY = 'newsletter::errors.already_confirmed';
}
