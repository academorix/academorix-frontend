<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a subscribe request targets an email on the
 * notifications-mail suppression list. Renders as HTTP 409.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterEmailSuppressedException extends AcademorixException
{
    public const CODE = 'newsletter.email_suppressed';

    public const TRANSLATION_KEY = 'newsletter::errors.email_suppressed';
}
