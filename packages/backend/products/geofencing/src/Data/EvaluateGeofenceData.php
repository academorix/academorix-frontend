<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Numeric;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Input DTO for a geofence evaluation.
 *
 * Carries the fenceable pair (WHAT the check ran against) + subject pair
 * (WHY the check ran) + location snapshot. Fenceable + subject types MUST
 * match registered aliases at strict-mode boot.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class EvaluateGeofenceData extends Data
{
    /**
     * @param  string  $fenceableType  Fenceable morph alias (e.g. `branch`).
     * @param  string  $fenceableId    Fenceable model id.
     * @param  float   $lat            Reported latitude (WGS84).
     * @param  float   $lng            Reported longitude (WGS84).
     * @param  int     $accuracyM      Reported accuracy in meters.
     * @param  string  $subjectType    Caller morph alias (e.g. `staff_clockin`).
     * @param  string  $subjectId      Caller model id.
     */
    public function __construct(
        #[Required, StringType, Regex('/^[a-z][a-z0-9_]+$/')]
        public string $fenceableType,

        #[Required, StringType]
        public string $fenceableId,

        #[Required, Numeric, Between(-90.0, 90.0)]
        public float $lat,

        #[Required, Numeric, Between(-180.0, 180.0)]
        public float $lng,

        #[Required, Min(0)]
        public int $accuracyM,

        #[Required, StringType, Regex('/^[a-z][a-z0-9_]+$/')]
        public string $subjectType,

        #[Required, StringType]
        public string $subjectId,
    ) {
    }
}
