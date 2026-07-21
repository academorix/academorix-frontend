<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a subscription lookup finds no match.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterSubscriptionNotFoundException extends StackraException
{
    public const CODE = 'newsletter.subscription_not_found';

    public const TRANSLATION_KEY = 'newsletter::errors.subscription_not_found';
}
