<?php

declare(strict_types=1);

namespace Stackra\Geofencing\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/geofence/overrides`.
 *
 * `reason` MUST be at least 10 characters — enforced both here (attribute)
 * and inside {@see \Stackra\Geofencing\Services\GeofenceOverrideService}
 * (belt + suspenders) since the service can be called from console + jobs
 * without HTTP validation.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class RequestOverrideRequestData extends Data
{
    /**
     * @param  string  $originalCheckId  The `gfc_*` id of the rejected check.
     * @param  string  $reason           Free-form reason — at least 10 chars.
     */
    public function __construct(
        #[Required, StringType]
        public string $originalCheckId,

        #[Required, StringType, Min(10), Max(500)]
        public string $reason,
    ) {
    }
}
