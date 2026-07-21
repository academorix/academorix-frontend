<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a confirmation or unsubscribe token is invalid,
 * expired, or its HMAC signature fails verification. Renders as
 * HTTP 404 to defeat token enumeration.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class InvalidUnsubscribeTokenException extends StackraException
{
    public const CODE = 'newsletter.token_invalid';

    public const TRANSLATION_KEY = 'newsletter::errors.token_invalid';
}
