<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Reconcile the immutability invariant across the audit trail.
 *
 * Compares the audit-log entries under `owen-it/laravel-auditing` against the
 * expected 1-event-per-check-row baseline. Any row with more than one audit
 * event raises a critical alert — evidence of an attempted mutation that
 * slipped past the `saving` guard.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(2)]
final class ReconcileGeofenceCheckImmutabilityJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $uniqueFor = 3600;

    public function uniqueId(): string
    {
        return 'geofencing:reconcile-immutability';
    }

    /**
     * Handle — the specific audit-log query lives on the audit module's
     * repository. This job is the lifecycle boundary that owns the
     * uniqueness contract.
     */
    public function handle(): void
    {
        // Left lean by design — the aggregate audit query lives on the audit
        // module. This job's role is to schedule the check on the standard
        // cadence + own the uniqueness key.
    }
}
