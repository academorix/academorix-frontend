<?php

declare(strict_types=1);

namespace Academorix\SportsDrillsSdk\Payloads\Drills;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/drills/{id}` (or the
 * tenant-scoped equivalent).
 *
 * Partial-update semantics — every property is typed
 * `T|Optional|null` with an `Optional` sentinel default. Spatie
 * Data's `toArray()` strips `Optional` values, so unmentioned fields
 * are never emitted (never clear server-side state). Pass `null`
 * explicitly to clear a nullable column.
 *
 * @category DrillsSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class UpdateDrillPayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string|null             $drillCategoryId
     * @param  Optional|string                  $sportKey
     * @param  Optional|string                  $name
     * @param  Optional|string|null             $objective
     * @param  Optional|string|null             $ageBand
     * @param  Optional|int|null                $durationMinutes
     * @param  Optional|string|null             $difficulty                 beginner / intermediate / advanced / expert.
     * @param  Optional|array|null              $equipment
     * @param  Optional|array|null              $coachingPoints
     * @param  Optional|string|null             $diagramDocumentId
     * @param  Optional|string|null             $videoDocumentId
     * @param  Optional|string|null             $publishedAt
     * @param  Optional|array|null              $tags
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType]
        public Optional|string $tenantId = new Optional(),

        #[StringType]
        public Optional|string|null $drillCategoryId = new Optional(),

        #[StringType]
        public Optional|string $sportKey = new Optional(),

        #[StringType]
        public Optional|string $name = new Optional(),

        #[StringType]
        public Optional|string|null $objective = new Optional(),

        #[StringType]
        public Optional|string|null $ageBand = new Optional(),

        public Optional|int|null $durationMinutes = new Optional(),

        #[StringType]
        public Optional|string|null $difficulty = new Optional(),

        public Optional|array|null $equipment = new Optional(),

        public Optional|array|null $coachingPoints = new Optional(),

        #[StringType]
        public Optional|string|null $diagramDocumentId = new Optional(),

        #[StringType]
        public Optional|string|null $videoDocumentId = new Optional(),

        #[StringType]
        public Optional|string|null $publishedAt = new Optional(),

        public Optional|array|null $tags = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
