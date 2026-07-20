<?php

declare(strict_types=1);

namespace Academorix\Approvals\Services;

use Academorix\Approvals\Contracts\Services\QuorumEvaluatorInterface;
use Academorix\Approvals\Enums\ApprovalDecisionOutcome;
use Academorix\Approvals\Enums\ApprovalQuorumType;
use Illuminate\Container\Attributes\Singleton;

/**
 * Pure quorum computation — deterministic function of the recorded
 * decisions + the group's `quorum_type` / `count` fields.
 *
 * `#[Singleton]` because the service is stateless — it neither
 * touches request state nor keeps any per-invocation memoisation.
 * See `.kiro/steering/octane-first-di.md`.
 *
 * ## Quorum semantics
 *
 *  * `All`     — every assigned approver must vote approve; a
 *    single deny rejects the group immediately.
 *  * `Any`     — one approve is enough; the group only rejects
 *    when every assigned approver has voted deny.
 *  * `NOfM`    — `count` approves grant the group; `total -
 *    count + 1` denies reject the group.
 *
 * @category Approvals
 *
 * @since    0.1.0
 */
#[Singleton]
final class QuorumEvaluator implements QuorumEvaluatorInterface
{
    /**
     * {@inheritDoc}
     */
    public function isGranted(
        ApprovalQuorumType $quorum,
        int $required,
        int $totalApprovers,
        array $decisions,
    ): bool {
        $approves = $this->countOutcome($decisions, ApprovalDecisionOutcome::Approve);

        return match ($quorum) {
            ApprovalQuorumType::All  => $approves >= $totalApprovers && $totalApprovers > 0,
            ApprovalQuorumType::Any  => $approves >= 1,
            ApprovalQuorumType::NOfM => $approves >= max(1, $required),
        };
    }

    /**
     * {@inheritDoc}
     */
    public function isRejected(
        ApprovalQuorumType $quorum,
        int $required,
        int $totalApprovers,
        array $decisions,
    ): bool {
        $denies = $this->countOutcome($decisions, ApprovalDecisionOutcome::Reject);

        return match ($quorum) {
            ApprovalQuorumType::All  => $denies >= 1,
            ApprovalQuorumType::Any  => $totalApprovers > 0 && $denies >= $totalApprovers,
            ApprovalQuorumType::NOfM => $denies >= max(1, $totalApprovers - max(1, $required) + 1),
        };
    }

    /**
     * Count decisions matching a specific outcome. Extracted so the
     * `isGranted` / `isRejected` bodies read at a glance.
     *
     * @param  array<int, ApprovalDecisionOutcome>  $decisions
     */
    private function countOutcome(array $decisions, ApprovalDecisionOutcome $target): int
    {
        return array_reduce(
            $decisions,
            static fn (int $acc, ApprovalDecisionOutcome $d): int => $d === $target ? $acc + 1 : $acc,
            0,
        );
    }
}
