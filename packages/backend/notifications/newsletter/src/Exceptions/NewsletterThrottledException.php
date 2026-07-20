<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when an operation is attempted on a newsletter the
 * reputation monitor has auto-throttled. Renders as HTTP 409 and
 * requires an admin to review + resume before further work.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterThrottledException extends AcademorixException
{
    public const CODE = 'newsletter.throttled';

    public const TRANSLATION_KEY = 'newsletter::errors.throttled';
}
