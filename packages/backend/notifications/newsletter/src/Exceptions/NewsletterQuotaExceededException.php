<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when the tenant's `newsletter.publications.max` entitlement
 * is exhausted. Renders as HTTP 402.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterQuotaExceededException extends Exception
{
    public const CODE = 'newsletter.quota_exceeded';

    public const TRANSLATION_KEY = 'newsletter::errors.quota_exceeded';
}
