<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a newsletter lookup finds no match.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterNotFoundException extends StackraException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'newsletter.newsletter_not_found';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'newsletter::errors.newsletter_not_found';
}
