<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a caller attempts to cancel a campaign whose send
 * batches have finished. Renders as HTTP 409.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class CampaignSendInProgressException extends AcademorixException
{
    public const CODE = 'newsletter.campaign_already_in_progress';

    public const TRANSLATION_KEY = 'newsletter::errors.campaign_already_in_progress';
}
