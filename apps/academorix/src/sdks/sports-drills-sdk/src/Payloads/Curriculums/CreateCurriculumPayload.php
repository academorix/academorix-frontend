<?php

declare(strict_types=1);

namespace Stackra\SportsDrillsSdk\Payloads\Curriculums;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/curriculums` (or the
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
final class CreateCurriculumPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $sportKey
     * @param  string                       $name
     * @param  int                          $totalWeeks                 6-16 typical range.
     * @param  bool                         $isActive
     * @param  ?string                      $ageBand
     * @param  ?string                      $objective
     * @param  ?string                      $clonedFromId
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $sportKey,

        #[StringType]
        public string $name,

        public int $totalWeeks,

        public bool $isActive,

        #[StringType]
        public ?string $ageBand = null,

        #[StringType]
        public ?string $objective = null,

        #[StringType]
        public ?string $clonedFromId = null,

        public ?array $metadata = null,
    ) {
    }
}
