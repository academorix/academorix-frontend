<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a campaign lookup finds no match.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterCampaignNotFoundException extends AcademorixException
{
    public const CODE = 'newsletter.campaign_not_found';

    public const TRANSLATION_KEY = 'newsletter::errors.campaign_not_found';
}
