<?php

declare(strict_types=1);

namespace Academorix\SportsDevelopmentSdk\Payloads\Goals;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/goals/{id}` (or the
 * tenant-scoped equivalent).
 *
 * Partial-update semantics — every property is typed
 * `T|Optional|null` with an `Optional` sentinel default. Spatie
 * Data's `toArray()` strips `Optional` values, so unmentioned fields
 * are never emitted (never clear server-side state). Pass `null`
 * explicitly to clear a nullable column.
 *
 * @category DevelopmentSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class UpdateGoalPayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string                  $athleteEnrollmentId
     * @param  Optional|string                  $createdByUserId
     * @param  Optional|string                  $title
     * @param  Optional|string|null             $description
     * @param  Optional|string|null             $targetDate
     * @param  Optional|string                  $status
     * @param  Optional|string|null             $achievedAt
     * @param  Optional|string|null             $achievementNotes
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType]
        public Optional|string $tenantId = new Optional(),

        #[StringType]
        public Optional|string $athleteEnrollmentId = new Optional(),

        #[StringType]
        public Optional|string $createdByUserId = new Optional(),

        #[StringType]
        public Optional|string $title = new Optional(),

        #[StringType]
        public Optional|string|null $description = new Optional(),

        #[StringType]
        public Optional|string|null $targetDate = new Optional(),

        #[StringType]
        public Optional|string $status = new Optional(),

        #[StringType]
        public Optional|string|null $achievedAt = new Optional(),

        #[StringType]
        public Optional|string|null $achievementNotes = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
