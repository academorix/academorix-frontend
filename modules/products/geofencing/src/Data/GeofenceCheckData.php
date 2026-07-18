<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Data;

use Academorix\Geofencing\Contracts\Data\GeofenceCheckInterface;
use Academorix\Geofencing\Enums\GeofenceMode;
use Academorix\Geofencing\Enums\GeofenceResult;
use Academorix\Geofencing\Models\GeofenceCheck;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for a {@see GeofenceCheck} row.
 *
 * `captured_location` is deliberately omitted from the standard shape —
 * restricted-tier field, gated to compliance-only surfaces.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class GeofenceCheckData extends Data
{
    /**
     * @param  string                  $id
     * @param  string                  $tenantId
     * @param  string                  $fenceableType
     * @param  string                  $fenceableId
     * @param  string                  $subjectType
     * @param  string                  $subjectId
     * @param  GeofenceResult          $result
     * @param  GeofenceMode            $mode
     * @param  int|null                $accuracyM
     * @param  float|null              $distanceToFenceM
     * @param  \DateTimeInterface      $evaluatedAt
     * @param  string|null             $supersedesCheckId
     * @param  string|null             $overriddenByUserId
     * @param  string|null             $overrideReason
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $fenceableType,
        public string $fenceableId,
        public string $subjectType,
        public string $subjectId,
        public GeofenceResult $result,
        public GeofenceMode $mode,
        public ?int $accuracyM,
        public ?float $distanceToFenceM,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $evaluatedAt,
        public ?string $supersedesCheckId,
        public ?string $overriddenByUserId,
        public ?string $overrideReason,
    ) {
    }

    /**
     * Build from a model.
     */
    public static function fromModel(GeofenceCheck $check): self
    {
        $resultValue = $check->{GeofenceCheckInterface::ATTR_RESULT};
        $result = $resultValue instanceof GeofenceResult
            ? $resultValue
            : (GeofenceResult::tryFrom((string) $resultValue) ?? GeofenceResult::Error);

        $modeValue = $check->{GeofenceCheckInterface::ATTR_MODE};
        $mode = $modeValue instanceof GeofenceMode
            ? $modeValue
            : (GeofenceMode::tryFrom((string) $modeValue) ?? GeofenceMode::Radius);

        return new self(
            id: (string) $check->getKey(),
            tenantId: (string) $check->{GeofenceCheckInterface::ATTR_TENANT_ID},
            fenceableType: (string) $check->{GeofenceCheckInterface::ATTR_FENCEABLE_TYPE},
            fenceableId: (string) $check->{GeofenceCheckInterface::ATTR_FENCEABLE_ID},
            subjectType: (string) $check->{GeofenceCheckInterface::ATTR_SUBJECT_TYPE},
            subjectId: (string) $check->{GeofenceCheckInterface::ATTR_SUBJECT_ID},
            result: $result,
            mode: $mode,
            accuracyM: $check->{GeofenceCheckInterface::ATTR_ACCURACY_M},
            distanceToFenceM: $check->{GeofenceCheckInterface::ATTR_DISTANCE_TO_FENCE_M},
            evaluatedAt: $check->{GeofenceCheckInterface::ATTR_EVALUATED_AT},
            supersedesCheckId: $check->{GeofenceCheckInterface::ATTR_SUPERSEDES_CHECK_ID},
            overriddenByUserId: $check->{GeofenceCheckInterface::ATTR_OVERRIDDEN_BY_USER_ID},
            overrideReason: $check->{GeofenceCheckInterface::ATTR_OVERRIDE_REASON},
        );
    }
}
