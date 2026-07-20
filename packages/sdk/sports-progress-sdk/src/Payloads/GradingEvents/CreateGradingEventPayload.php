<?php

declare(strict_types=1);

namespace Academorix\SportsProgressSdk\Payloads\GradingEvents;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/grading-events` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateGradingEventPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $branchId
     * @param  string                       $sportKey
     * @param  string                       $name
     * @param  string                       $scheduledAt
     * @param  string                       $examinerCoachId
     * @param  string                       $status                     scheduled / in_progress / completed / cancelled.
     * @param  ?string                      $completedAt
     * @param  ?string                      $venueFacilityId
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $branchId,

        #[StringType]
        public string $sportKey,

        #[StringType]
        public string $name,

        #[StringType]
        public string $scheduledAt,

        #[StringType]
        public string $examinerCoachId,

        #[StringType]
        public string $status,

        #[StringType]
        public ?string $completedAt = null,

        #[StringType]
        public ?string $venueFacilityId = null,

        public ?array $metadata = null,
    ) {
    }
}
