<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when an issue lookup finds no match.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterIssueNotFoundException extends AcademorixException
{
    public const CODE = 'newsletter.issue_not_found';

    public const TRANSLATION_KEY = 'newsletter::errors.issue_not_found';
}
