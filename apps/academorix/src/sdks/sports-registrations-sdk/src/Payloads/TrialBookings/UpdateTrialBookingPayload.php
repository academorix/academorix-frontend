<?php

declare(strict_types=1);

namespace Stackra\SportsRegistrationsSdk\Payloads\TrialBookings;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/trial-bookings/{id}` (or the
 * tenant-scoped equivalent).
 *
 * Partial-update semantics — every property is typed
 * `T|Optional|null` with an `Optional` sentinel default. Spatie
 * Data's `toArray()` strips `Optional` values, so unmentioned fields
 * are never emitted (never clear server-side state). Pass `null`
 * explicitly to clear a nullable column.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class UpdateTrialBookingPayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string                  $registrationId
     * @param  Optional|string                  $facilityId
     * @param  Optional|string|null             $resourceBookingId          The ResourceBooking that reserves the facility slot.
     * @param  Optional|string|null             $coachId
     * @param  Optional|string                  $scheduledAt
     * @param  Optional|string                  $endsAt
     * @param  Optional|string                  $status
     * @param  Optional|string|null             $attendedAt
     * @param  Optional|string|null             $cancellationReason
     * @param  Optional|string|null             $notes
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType]
        public Optional|string $tenantId = new Optional(),

        #[StringType]
        public Optional|string $registrationId = new Optional(),

        #[StringType]
        public Optional|string $facilityId = new Optional(),

        #[StringType]
        public Optional|string|null $resourceBookingId = new Optional(),

        #[StringType]
        public Optional|string|null $coachId = new Optional(),

        #[StringType]
        public Optional|string $scheduledAt = new Optional(),

        #[StringType]
        public Optional|string $endsAt = new Optional(),

        #[StringType]
        public Optional|string $status = new Optional(),

        #[StringType]
        public Optional|string|null $attendedAt = new Optional(),

        #[StringType]
        public Optional|string|null $cancellationReason = new Optional(),

        #[StringType]
        public Optional|string|null $notes = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
