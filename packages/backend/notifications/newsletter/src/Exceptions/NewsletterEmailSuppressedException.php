<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a subscribe request targets an email on the
 * notifications-mail suppression list. Renders as HTTP 409.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterEmailSuppressedException extends StackraException
{
    public const CODE = 'newsletter.email_suppressed';

    public const TRANSLATION_KEY = 'newsletter::errors.email_suppressed';
}
