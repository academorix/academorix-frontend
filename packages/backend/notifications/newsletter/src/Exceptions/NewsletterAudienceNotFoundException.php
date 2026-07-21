<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when an audience lookup finds no match.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterAudienceNotFoundException extends Exception
{
    public const CODE = 'newsletter.audience_not_found';

    public const TRANSLATION_KEY = 'newsletter::errors.audience_not_found';
}
