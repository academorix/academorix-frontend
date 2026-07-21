<?php

declare(strict_types=1);

namespace Stackra\SportsDevelopmentSdk\Payloads\Goals;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/goals` (or the
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
final class CreateGoalPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $athleteEnrollmentId
     * @param  string                       $createdByUserId
     * @param  string                       $title
     * @param  string                       $status
     * @param  ?string                      $description
     * @param  ?string                      $targetDate
     * @param  ?string                      $achievedAt
     * @param  ?string                      $achievementNotes
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $athleteEnrollmentId,

        #[StringType]
        public string $createdByUserId,

        #[StringType]
        public string $title,

        #[StringType]
        public string $status,

        #[StringType]
        public ?string $description = null,

        #[StringType]
        public ?string $targetDate = null,

        #[StringType]
        public ?string $achievedAt = null,

        #[StringType]
        public ?string $achievementNotes = null,

        public ?array $metadata = null,
    ) {
    }
}
