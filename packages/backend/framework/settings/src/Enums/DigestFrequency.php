<?php

declare(strict_types=1);

/**
 * Digest Frequency Enumeration
 *
 * Defines the set of allowed values for Digest Frequency within the Settings module.
 * Supported values include: Hourly, Daily, Weekly.
 *
 * @category Enums
 *
 * @since    1.0.0
 */
namespace Academorix\Settings\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Enum;

/** Notification digest delivery frequency. */
enum DigestFrequency: string
{
    use Enum;

    #[Label('Hourly')]
    #[Description('Sends a notification digest every hour.')]
    case Hourly = 'hourly';

    #[Label('Daily')]
    #[Description('Sends a notification digest once per day.')]
    case Daily = 'daily';

    #[Label('Weekly')]
    #[Description('Sends a notification digest once per week.')]
    case Weekly = 'weekly';
}
