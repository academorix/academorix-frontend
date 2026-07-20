<?php

declare(strict_types=1);

namespace Academorix\SportsDevelopmentSdk\Payloads\PathwayStages;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/pathway-stages` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category DevelopmentSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreatePathwayStagePayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $developmentPathwayId
     * @param  string                       $name
     * @param  int                          $order                      Ordered progression within a pathway.
     * @param  ?array                       $criteria                   Attribute-driven promotion criteria.
     * @param  ?string                      $attributeSetSnapshotId
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $developmentPathwayId,

        #[StringType]
        public string $name,

        public int $order,

        public ?array $criteria = null,

        #[StringType]
        public ?string $attributeSetSnapshotId = null,

        public ?array $metadata = null,
    ) {
    }
}
