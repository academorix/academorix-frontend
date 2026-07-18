<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when an audience lookup finds no match.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterAudienceNotFoundException extends AcademorixException
{
    public const CODE = 'newsletter.audience_not_found';

    public const TRANSLATION_KEY = 'newsletter::errors.audience_not_found';
}
