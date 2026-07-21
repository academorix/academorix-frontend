<?php

declare(strict_types=1);

namespace Stackra\Geofencing\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

use Stackra\Events\Attributes\AsEvent;
/**
 * A new override row was minted — supersedes the original OUTSIDE / ERROR
 * check with an admin-approved INSIDE row.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class GeofenceOverrideApplied implements ShouldDispatchAfterCommit
{
    public function __construct(
        public string $newCheckId,
        public string $supersedesCheckId,
        public string $fenceableType,
        public string $fenceableId,
        public string $overriddenByUserId,
        public string $overrideReason,
    ) {
    }
}
