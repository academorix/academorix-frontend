<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a subscription lookup finds no match.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterSubscriptionNotFoundException extends AcademorixException
{
    public const CODE = 'newsletter.subscription_not_found';

    public const TRANSLATION_KEY = 'newsletter::errors.subscription_not_found';
}
