<?php

declare(strict_types=1);

namespace Stackra\SportsMedicalSdk\Payloads\Injuries;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/injuries/{id}` (or the
 * tenant-scoped equivalent).
 *
 * Partial-update semantics — every property is typed
 * `T|Optional|null` with an `Optional` sentinel default. Spatie
 * Data's `toArray()` strips `Optional` values, so unmentioned fields
 * are never emitted (never clear server-side state). Pass `null`
 * explicitly to clear a nullable column.
 *
 * @category MedicalSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class UpdateInjuryPayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string                  $athleteId
     * @param  Optional|string|null             $medicalRecordId
     * @param  Optional|string                  $bodyPart                   hamstring / knee / shoulder / ankle / …
     * @param  Optional|string|null             $mechanism                  contact / non_contact / overuse / recurrence.
     * @param  Optional|string                  $severity                   minor / moderate / severe / critical.
     * @param  Optional|string                  $onsetAt
     * @param  Optional|string                  $reportedByUserId
     * @param  Optional|string                  $status
     * @param  Optional|string|null             $clearedAt
     * @param  Optional|string|null             $clearedByUserId
     * @param  Optional|string|null             $notesEncrypted             Encrypted at rest.
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType]
        public Optional|string $tenantId = new Optional(),

        #[StringType]
        public Optional|string $athleteId = new Optional(),

        #[StringType]
        public Optional|string|null $medicalRecordId = new Optional(),

        #[StringType]
        public Optional|string $bodyPart = new Optional(),

        #[StringType]
        public Optional|string|null $mechanism = new Optional(),

        #[StringType]
        public Optional|string $severity = new Optional(),

        #[StringType]
        public Optional|string $onsetAt = new Optional(),

        #[StringType]
        public Optional|string $reportedByUserId = new Optional(),

        #[StringType]
        public Optional|string $status = new Optional(),

        #[StringType]
        public Optional|string|null $clearedAt = new Optional(),

        #[StringType]
        public Optional|string|null $clearedByUserId = new Optional(),

        #[StringType]
        public Optional|string|null $notesEncrypted = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
