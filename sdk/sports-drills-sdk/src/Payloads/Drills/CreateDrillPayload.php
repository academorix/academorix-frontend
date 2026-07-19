<?php

declare(strict_types=1);

namespace Academorix\SportsDrillsSdk\Payloads\Drills;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/drills` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category DrillsSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateDrillPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $sportKey
     * @param  string                       $name
     * @param  ?string                      $drillCategoryId
     * @param  ?string                      $objective
     * @param  ?string                      $ageBand
     * @param  ?int                         $durationMinutes
     * @param  ?string                      $difficulty                 beginner / intermediate / advanced / expert.
     * @param  ?array                       $equipment
     * @param  ?array                       $coachingPoints
     * @param  ?string                      $diagramDocumentId
     * @param  ?string                      $videoDocumentId
     * @param  ?string                      $publishedAt
     * @param  ?array                       $tags
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $sportKey,

        #[StringType]
        public string $name,

        #[StringType]
        public ?string $drillCategoryId = null,

        #[StringType]
        public ?string $objective = null,

        #[StringType]
        public ?string $ageBand = null,

        public ?int $durationMinutes = null,

        #[StringType]
        public ?string $difficulty = null,

        public ?array $equipment = null,

        public ?array $coachingPoints = null,

        #[StringType]
        public ?string $diagramDocumentId = null,

        #[StringType]
        public ?string $videoDocumentId = null,

        #[StringType]
        public ?string $publishedAt = null,

        public ?array $tags = null,

        public ?array $metadata = null,
    ) {
    }
}
