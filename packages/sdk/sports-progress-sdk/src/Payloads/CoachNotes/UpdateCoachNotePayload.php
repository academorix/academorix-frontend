<?php

declare(strict_types=1);

namespace Academorix\SportsProgressSdk\Payloads\CoachNotes;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/coach-notes/{id}` (or the
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
final class UpdateCoachNotePayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string                  $athleteEnrollmentId
     * @param  Optional|string                  $coachUserId
     * @param  Optional|string                  $body
     * @param  Optional|string                  $visibility
     * @param  Optional|string|null             $revisionOfId
     * @param  Optional|string|null             $sharedAt
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType]
        public Optional|string $tenantId = new Optional(),

        #[StringType]
        public Optional|string $athleteEnrollmentId = new Optional(),

        #[StringType]
        public Optional|string $coachUserId = new Optional(),

        #[StringType]
        public Optional|string $body = new Optional(),

        #[StringType]
        public Optional|string $visibility = new Optional(),

        #[StringType]
        public Optional|string|null $revisionOfId = new Optional(),

        #[StringType]
        public Optional|string|null $sharedAt = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
