<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when an operation is attempted on a newsletter the
 * reputation monitor has auto-throttled. Renders as HTTP 409 and
 * requires an admin to review + resume before further work.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterThrottledException extends StackraException
{
    public const CODE = 'newsletter.throttled';

    public const TRANSLATION_KEY = 'newsletter::errors.throttled';
}
