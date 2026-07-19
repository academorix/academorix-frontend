<?php

declare(strict_types=1);

namespace Academorix\SportsDrillsSdk\Payloads\SessionPlans;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/session-plans` (or the
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
final class CreateSessionPlanPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $sportKey
     * @param  string                       $name
     * @param  ?string                      $objective
     * @param  ?int                         $durationMinutes
     * @param  ?string                      $curriculumWeekId
     * @param  ?string                      $publishedAt
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
        public ?string $objective = null,

        public ?int $durationMinutes = null,

        #[StringType]
        public ?string $curriculumWeekId = null,

        #[StringType]
        public ?string $publishedAt = null,

        public ?array $metadata = null,
    ) {
    }
}
