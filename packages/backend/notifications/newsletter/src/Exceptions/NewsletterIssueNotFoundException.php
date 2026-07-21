<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when an issue lookup finds no match.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterIssueNotFoundException extends Exception
{
    public const CODE = 'newsletter.issue_not_found';

    public const TRANSLATION_KEY = 'newsletter::errors.issue_not_found';
}
