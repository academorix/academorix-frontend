<?php

declare(strict_types=1);

namespace Academorix\Approvals\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Approve / reject outcome of a single {@see \Academorix\Approvals\Models\ApprovalDecision}.
 *
 * Persists as `approval_decisions.decision`. Domain code reads
 * this enum; the auto-generated `ApprovalDecisionDecision` variant
 * exists for schema-mirroring but is NOT consumed by domain
 * services — this canonical name is.
 *
 * ## Cases
 *
 *  * {@see self::Approve}  — the reviewer voted for the request.
 *  * {@see self::Reject}   — the reviewer voted against the request.
 *
 * @category Approvals
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum ApprovalDecisionOutcome: string
{
    use Enum;

    #[Label('Approve')]
    #[Description('The reviewer voted for the request. Counts toward the group\'s approve quorum.')]
    case Approve = 'approve';

    #[Label('Reject')]
    #[Description('The reviewer voted against the request. Counts toward the group\'s reject threshold.')]
    case Reject = 'reject';
}
