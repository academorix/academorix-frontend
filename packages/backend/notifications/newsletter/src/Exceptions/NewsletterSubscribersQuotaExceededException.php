<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a newsletter's `subscribers_max` entitlement is
 * exhausted. Renders as HTTP 402.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterSubscribersQuotaExceededException extends AcademorixException
{
    public const CODE = 'newsletter.subscribers_quota_exceeded';

    public const TRANSLATION_KEY = 'newsletter::errors.subscribers_quota_exceeded';
}
