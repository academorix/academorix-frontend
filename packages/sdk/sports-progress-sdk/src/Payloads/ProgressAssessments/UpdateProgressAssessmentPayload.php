<?php

declare(strict_types=1);

namespace Academorix\SportsProgressSdk\Payloads\ProgressAssessments;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/progress-assessments/{id}` (or the
 * tenant-scoped equivalent).
 *
 * Partial-update semantics — every property is typed
 * `T|Optional|null` with an `Optional` sentinel default. Spatie
 * Data's `toArray()` strips `Optional` values, so unmentioned fields
 * are never emitted (never clear server-side state). Pass `null`
 * explicitly to clear a nullable column.
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class UpdateProgressAssessmentPayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string                  $athleteEnrollmentId
     * @param  Optional|string                  $captureDate
     * @param  Optional|string                  $assessedAt
     * @param  Optional|string                  $assessedByUserId
     * @param  Optional|array                   $values                     Attribute values keyed by definition code.
     * @param  Optional|string                  $attributeSetSnapshotId     The AttributeSet version this assessment was captured against.
     * @param  Optional|string                  $sportKey                   Denormalised from athlete_enrollment.
     * @param  Optional|string|null             $overallScore               Computed weighted overall (0-100 typical range).
     * @param  Optional|string|null             $overallTier                bronze / silver / gold / diamond.
     * @param  Optional|string|null             $notes
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType, Regex('/^ten_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public Optional|string $tenantId = new Optional(),

        #[StringType, Regex('/^aen_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public Optional|string $athleteEnrollmentId = new Optional(),

        #[StringType]
        public Optional|string $captureDate = new Optional(),

        #[StringType]
        public Optional|string $assessedAt = new Optional(),

        #[StringType]
        public Optional|string $assessedByUserId = new Optional(),

        public Optional|array $values = new Optional(),

        #[StringType, Regex('/^asg_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public Optional|string $attributeSetSnapshotId = new Optional(),

        #[StringType, Max(32)]
        public Optional|string $sportKey = new Optional(),

        #[StringType]
        public Optional|string|null $overallScore = new Optional(),

        #[StringType]
        public Optional|string|null $overallTier = new Optional(),

        #[StringType]
        public Optional|string|null $notes = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
