<?php

declare(strict_types=1);

namespace Stackra\Geofencing\Contracts\Services;

use Stackra\Geofencing\Contracts\Geofenceable;
use Stackra\Geofencing\Data\EvaluateGeofenceData;
use Stackra\Geofencing\Data\GeofenceCheckResultData;
use Stackra\Geofencing\Services\GeofenceService;
use Illuminate\Container\Attributes\Bind;

/**
 * The evaluator seam.
 *
 * Two entry points share one decision tree — {@see evaluate()} persists a
 * row; {@see healthCheck()} runs the same math WITHOUT persistence for the
 * mobile pre-flight endpoint.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[Bind(GeofenceService::class)]
interface GeofenceServiceInterface
{
    /**
     * Persist a geofence check for the input + return the result DTO.
     */
    public function evaluate(Geofenceable $fenceable, EvaluateGeofenceData $input): GeofenceCheckResultData;

    /**
     * Same decision tree as {@see evaluate()} but returns the DTO with
     * `checkId = null` + does NOT persist. Used by the /preflight endpoint.
     */
    public function healthCheck(Geofenceable $fenceable, EvaluateGeofenceData $input): GeofenceCheckResultData;
}
