<?php

declare(strict_types=1);

namespace Stackra\Geofencing\Events;

use Stackra\Geofencing\Data\EvaluateGeofenceData;
use Stackra\Geofencing\Models\GeofenceCheck;

use Stackra\Events\Attributes\AsEvent;
/**
 * Fired synchronously by {@see \Stackra\Geofencing\Services\GeofenceService::evaluate()}
 * immediately after the row is persisted.
 *
 * Public wire contract: `contracts/geofence-evaluated.v1.json`. Consumers read
 * `event->check` (the persisted row) + `event->input` (the originating DTO)
 * and filter on `event->input->subjectType` to react only to their own
 * subject alias.
 *
 * NOT `ShouldDispatchAfterCommit` — evaluate() runs OUTSIDE a transaction
 * (single INSERT). Firing sync means listeners see the just-written row on
 * the very next query.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class GeofenceEvaluated
{
    public function __construct(
        public GeofenceCheck $check,
        public EvaluateGeofenceData $input,
    ) {
    }
}
