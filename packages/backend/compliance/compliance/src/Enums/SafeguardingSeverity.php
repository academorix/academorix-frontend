<?php

declare(strict_types=1);

namespace Stackra\Compliance\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Severity of a `SafeguardingIncident`. Drives the escalation SLA.
 *
 * ## SLAs
 *
 *  * info     — no SLA.
 *  * concern  — 120h (5 business days).
 *  * urgent   — 24h.
 *  * critical — 1h; escalate to external authority per jurisdiction.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SafeguardingSeverity: string
{
    use Enum;

    #[Label('Info')]
    #[Description('Observation only; no action needed.')]
    case Info = 'info';

    #[Label('Concern')]
    #[Description('Single flag; review + close_no_action or escalate within 5 business days.')]
    case Concern = 'concern';

    #[Label('Urgent')]
    #[Description('Multiple flags or keyword match; investigate within 24h.')]
    case Urgent = 'urgent';

    #[Label('Critical')]
    #[Description('Immediate risk; escalate within 1h to tenant safeguarding officer + external authority.')]
    case Critical = 'critical';
}
