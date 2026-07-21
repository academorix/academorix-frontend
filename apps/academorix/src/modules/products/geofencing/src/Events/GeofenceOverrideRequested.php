<?php

declare(strict_types=1);

namespace Stackra\Geofencing\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

use Stackra\Events\Attributes\AsEvent;
/**
 * A caller requested an admin override on a rejected geofence check.
 *
 * Approvals module picks this up, creates the review task, and eventually
 * fires either `ApprovalTaskApproved` (→ we mint an override row) or
 * `ApprovalTaskRejected` (→ we fire `GeofenceOverrideRejected`).
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class GeofenceOverrideRequested implements ShouldDispatchAfterCommit
{
    public function __construct(
        public string $originalCheckId,
        public string $requesterUserId,
        public string $reason,
        public string $approvalTaskId,
    ) {
    }
}
