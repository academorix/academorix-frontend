<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

use Stackra\Events\Attributes\AsEvent;
/**
 * An override request was rejected by the approvals workflow.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class GeofenceOverrideRejected implements ShouldDispatchAfterCommit
{
    public function __construct(
        public string $originalCheckId,
        public string $requesterUserId,
        public string $rejectedByUserId,
        public ?string $rejectReason,
    ) {
    }
}
