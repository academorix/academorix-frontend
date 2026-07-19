<?php

declare(strict_types=1);

namespace Academorix\GrowthCrmLeadsSdk\Payloads\Leads;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/leads/{id}` (or the
 * tenant-scoped equivalent).
 *
 * Partial-update semantics — every property is typed
 * `T|Optional|null` with an `Optional` sentinel default. Spatie
 * Data's `toArray()` strips `Optional` values, so unmentioned fields
 * are never emitted (never clear server-side state). Pass `null`
 * explicitly to clear a nullable column.
 *
 * @category CrmLeadsSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class UpdateLeadPayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string                  $firstName
     * @param  Optional|string|null             $lastName
     * @param  Optional|string|null             $email
     * @param  Optional|string|null             $phone
     * @param  Optional|string                  $source                     web_form / referral / walk_in / cold_outreach / campaign_{key}.
     * @param  Optional|string|null             $campaignId
     * @param  Optional|string|null             $referralCodeId
     * @param  Optional|string|null             $sportInterest
     * @param  Optional|int|null                $ageOfAthlete               Age of prospective athlete (if applicable).
     * @param  Optional|string                  $stage
     * @param  Optional|string|null             $ownerUserId
     * @param  Optional|string|null             $firstContactAt
     * @param  Optional|string|null             $convertedAt
     * @param  Optional|string|null             $convertedAthleteId
     * @param  Optional|string|null             $lostAt
     * @param  Optional|string|null             $lostReason
     * @param  Optional|int|null                $score                      Lead score 0-100.
     * @param  Optional|string|null             $notes
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType]
        public Optional|string $tenantId = new Optional(),

        #[StringType]
        public Optional|string $firstName = new Optional(),

        #[StringType]
        public Optional|string|null $lastName = new Optional(),

        #[StringType]
        public Optional|string|null $email = new Optional(),

        #[StringType]
        public Optional|string|null $phone = new Optional(),

        #[StringType]
        public Optional|string $source = new Optional(),

        #[StringType]
        public Optional|string|null $campaignId = new Optional(),

        #[StringType]
        public Optional|string|null $referralCodeId = new Optional(),

        #[StringType]
        public Optional|string|null $sportInterest = new Optional(),

        public Optional|int|null $ageOfAthlete = new Optional(),

        #[StringType]
        public Optional|string $stage = new Optional(),

        #[StringType]
        public Optional|string|null $ownerUserId = new Optional(),

        #[StringType]
        public Optional|string|null $firstContactAt = new Optional(),

        #[StringType]
        public Optional|string|null $convertedAt = new Optional(),

        #[StringType]
        public Optional|string|null $convertedAthleteId = new Optional(),

        #[StringType]
        public Optional|string|null $lostAt = new Optional(),

        #[StringType]
        public Optional|string|null $lostReason = new Optional(),

        public Optional|int|null $score = new Optional(),

        #[StringType]
        public Optional|string|null $notes = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
