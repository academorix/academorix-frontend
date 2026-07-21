<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a campaign lookup finds no match.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterCampaignNotFoundException extends Exception
{
    public const CODE = 'newsletter.campaign_not_found';

    public const TRANSLATION_KEY = 'newsletter::errors.campaign_not_found';
}
