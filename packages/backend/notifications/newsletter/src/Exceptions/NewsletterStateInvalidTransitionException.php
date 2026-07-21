<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a state transition is illegal — e.g. scheduling an
 * issue whose state is `sent`, or cancelling a `completed`
 * campaign.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterStateInvalidTransitionException extends Exception
{
    public const CODE = 'newsletter.state_invalid_transition';

    public const TRANSLATION_KEY = 'newsletter::errors.state_invalid_transition';
}
