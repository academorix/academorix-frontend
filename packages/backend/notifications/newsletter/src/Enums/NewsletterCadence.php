<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Publishing cadence of a {@see \Stackra\Newsletter\Models\Newsletter}.
 *
 * Advisory metadata — the scheduler uses the cadence to hint the UI
 * and to auto-increment `issue_number` for regular cadences. Manual
 * newsletters never auto-increment; the editor sets a bespoke slug.
 *
 * ## Cases
 *
 *  * {@see self::Daily}   — one issue per day (rare in practice).
 *  * {@see self::Weekly}  — most common cadence.
 *  * {@see self::Monthly} — long-form editorial cadence.
 *  * {@see self::Manual}  — ad-hoc; editor decides each send.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum NewsletterCadence: string
{
    use Enum;

    /**
     * Daily — one issue per day.
     */
    #[Label('Daily')]
    #[Description('One issue per day.')]
    case Daily = 'daily';

    /**
     * Weekly — one issue per week.
     */
    #[Label('Weekly')]
    #[Description('One issue per week.')]
    case Weekly = 'weekly';

    /**
     * Monthly — one issue per month.
     */
    #[Label('Monthly')]
    #[Description('One issue per month.')]
    case Monthly = 'monthly';

    /**
     * Manual — ad-hoc send; editor decides each time.
     */
    #[Label('Manual')]
    #[Description('Ad-hoc send. Editor decides each issue.')]
    case Manual = 'manual';
}
