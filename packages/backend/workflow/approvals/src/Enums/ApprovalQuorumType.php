<?php

declare(strict_types=1);

namespace Stackra\Approvals\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Group-quorum semantics for an approval requirement.
 *
 * Persists as `approval_template_approvers.quorum_type` and copied
 * onto `approval_requirements.quorum_type` at instance-create time.
 * Domain code reads this enum; the auto-generated
 * `ApprovalRequirementQuorumType` / `ApprovalTemplateApproverQuorumType`
 * variants exist for schema-mirroring but are NOT consumed by domain
 * services — this canonical name is.
 *
 * ## Cases
 *
 *  * {@see self::All}  — every assigned approver must vote approve.
 *    Any single deny rejects the group.
 *  * {@see self::Any}  — one approve grants the group. The group
 *    only rejects when every approver votes deny.
 *  * {@see self::NOfM} — `count` approves grant the group;
 *    `total - count + 1` denies reject the group.
 *
 * @category Approvals
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum ApprovalQuorumType: string
{
    use Enum;

    #[Label('All required')]
    #[Description('Every assigned approver must vote approve. A single deny rejects the group.')]
    case All = 'all';

    #[Label('Any one')]
    #[Description('One approve grants the group. Rejects only when every approver votes deny.')]
    case Any = 'any';

    #[Label('N of M')]
    #[Description('`count` approves grant the group; the mirror-count of denies rejects it.')]
    case NOfM = 'n_of_m';
}
