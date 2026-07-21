<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when an audience expression fails validation.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterAudienceExpressionInvalidException extends StackraException
{
    public const CODE = 'newsletter.audience_expression_invalid';

    public const TRANSLATION_KEY = 'newsletter::errors.audience_expression_invalid';
}
