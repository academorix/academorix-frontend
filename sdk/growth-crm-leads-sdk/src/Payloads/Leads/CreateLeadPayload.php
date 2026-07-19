<?php

declare(strict_types=1);

namespace Academorix\GrowthCrmLeadsSdk\Payloads\Leads;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/leads` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category CrmLeadsSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateLeadPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $firstName
     * @param  string                       $source                     web_form / referral / walk_in / cold_outreach / campaign_{key}.
     * @param  string                       $stage
     * @param  ?string                      $lastName
     * @param  ?string                      $email
     * @param  ?string                      $phone
     * @param  ?string                      $campaignId
     * @param  ?string                      $referralCodeId
     * @param  ?string                      $sportInterest
     * @param  ?int                         $ageOfAthlete               Age of prospective athlete (if applicable).
     * @param  ?string                      $ownerUserId
     * @param  ?string                      $firstContactAt
     * @param  ?string                      $convertedAt
     * @param  ?string                      $convertedAthleteId
     * @param  ?string                      $lostAt
     * @param  ?string                      $lostReason
     * @param  ?int                         $score                      Lead score 0-100.
     * @param  ?string                      $notes
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $firstName,

        #[StringType]
        public string $source,

        #[StringType]
        public string $stage,

        #[StringType]
        public ?string $lastName = null,

        #[StringType]
        public ?string $email = null,

        #[StringType]
        public ?string $phone = null,

        #[StringType]
        public ?string $campaignId = null,

        #[StringType]
        public ?string $referralCodeId = null,

        #[StringType]
        public ?string $sportInterest = null,

        public ?int $ageOfAthlete = null,

        #[StringType]
        public ?string $ownerUserId = null,

        #[StringType]
        public ?string $firstContactAt = null,

        #[StringType]
        public ?string $convertedAt = null,

        #[StringType]
        public ?string $convertedAthleteId = null,

        #[StringType]
        public ?string $lostAt = null,

        #[StringType]
        public ?string $lostReason = null,

        public ?int $score = null,

        #[StringType]
        public ?string $notes = null,

        public ?array $metadata = null,
    ) {
    }
}
