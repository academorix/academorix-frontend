<?php

declare(strict_types=1);

namespace Stackra\Geofencing\Data;

use Stackra\Geofencing\Enums\GeofenceMode;
use Stackra\Geofencing\Enums\GeofenceResult;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for a geofence evaluation.
 *
 * `checkId` is null for preflight results (the /preflight endpoint runs the
 * same decision tree WITHOUT persistence).
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class GeofenceCheckResultData extends Data
{
    /**
     * @param  GeofenceResult   $result             Evaluation verdict.
     * @param  GeofenceMode     $mode               Which geometry mode ran.
     * @param  string|null      $checkId            Persisted row id, null for preflight.
     * @param  float|null       $distanceToFenceM   Distance to the fence edge in meters.
     * @param  int              $accuracyM          Reported accuracy at input.
     * @param  string           $fenceableType      Fenceable morph alias.
     * @param  string           $fenceableId        Fenceable model id.
     */
    public function __construct(
        public GeofenceResult $result,
        public GeofenceMode $mode,
        public ?string $checkId,
        public ?float $distanceToFenceM,
        public int $accuracyM,
        public string $fenceableType,
        public string $fenceableId,
    ) {
    }
}
