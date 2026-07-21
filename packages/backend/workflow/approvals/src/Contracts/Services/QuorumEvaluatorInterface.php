<?php

declare(strict_types=1);

namespace Stackra\Approvals\Contracts\Services;

use Stackra\Approvals\Enums\ApprovalDecisionOutcome;
use Stackra\Approvals\Enums\ApprovalQuorumType;
use Stackra\Approvals\Services\QuorumEvaluator;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the group-quorum decider.
 *
 * Every {@see \Stackra\Approvals\Models\ApprovalRequirement} group
 * defines a `quorum_type` (`all` / `any` / `n_of_m`) + optional
 * `count` (for `n_of_m`). This service computes whether a set of
 * recorded decisions satisfies that quorum, and — separately —
 * whether the group has been REJECTED (any `deny` in an `all`
 * group; every `deny` in an `any` group; `total - count + 1` denies
 * in an `n_of_m` group).
 *
 * Concrete: {@see QuorumEvaluator}.
 *
 * @category Approvals
 *
 * @since    0.1.0
 */
#[Bind(QuorumEvaluator::class)]
interface QuorumEvaluatorInterface
{
    /**
     * Return `true` when the group's approve quorum is met by the
     * current decisions.
     *
     * @param  ApprovalQuorumType             $quorum            The rule.
     * @param  int                            $required          Only used when quorum is `NOfM`; ignored otherwise.
     * @param  int                            $totalApprovers    Total approvers assigned to this group.
     * @param  array<int, ApprovalDecisionOutcome>  $decisions  Ordered list of decisions recorded so far.
     */
    public function isGranted(
        ApprovalQuorumType $quorum,
        int $required,
        int $totalApprovers,
        array $decisions,
    ): bool;

    /**
     * Return `true` when the group can no longer be satisfied — a
     * reject vote (or votes) has pushed the outcome past the
     * quorum's threshold.
     *
     * @param  array<int, ApprovalDecisionOutcome>  $decisions  Ordered list of decisions recorded so far.
     */
    public function isRejected(
        ApprovalQuorumType $quorum,
        int $required,
        int $totalApprovers,
        array $decisions,
    ): bool;
}
