<?php

declare(strict_types=1);

namespace Stackra\Compliance\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * State machine for a `SafeguardingIncident` row.
 *
 * `reported` → `triaging` → `investigating` → `resolved`.
 * Any early state can `close_no_action`; `investigating` can escalate.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SafeguardingIncidentState: string
{
    use Enum;

    #[Label('Reported')]
    #[Description('New report received; awaiting triage.')]
    case Reported = 'reported';

    #[Label('Triaging')]
    #[Description('Tenant safeguarding lead is triaging the report.')]
    case Triaging = 'triaging';

    #[Label('Investigating')]
    #[Description('Under active investigation.')]
    case Investigating = 'investigating';

    #[Label('Escalated')]
    #[Description('Escalated to tenant safeguarding officer + external authority.')]
    case Escalated = 'escalated';

    #[Label('Resolved')]
    #[Description('Case resolved.')]
    case Resolved = 'resolved';

    #[Label('Closed — No Action')]
    #[Description('Report reviewed; no action required.')]
    case ClosedNoAction = 'closed_no_action';
}
