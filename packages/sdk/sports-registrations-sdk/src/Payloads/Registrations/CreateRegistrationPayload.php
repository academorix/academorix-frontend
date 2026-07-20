<?php

declare(strict_types=1);

namespace Academorix\SportsRegistrationsSdk\Payloads\Registrations;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/registrations` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateRegistrationPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $seasonId
     * @param  string                       $sportKey
     * @param  string                       $applicantFirstName
     * @param  string                       $applicantLastName
     * @param  string                       $applicantEmail
     * @param  string                       $athleteFirstName
     * @param  string                       $stage
     * @param  string                       $submittedAt
     * @param  string                       $source                     web_form / referral / walk_in / cold_outreach / imported / external_crm.
     * @param  ?string                      $teamId                     Optional — a registration may target a program rather than a specific team.
     * @param  ?string                      $branchId
     * @param  ?string                      $applicantPhone
     * @param  ?string                      $athleteLastName
     * @param  ?string                      $athleteDateOfBirth         Used by ValidateAgeAgainstSeason on trial + offer + convert transitions.
     * @param  ?string                      $athleteGender
     * @param  ?string                      $expiresAt                  Auto-decline after 30d inactive by default.
     * @param  ?string                      $declinedAt
     * @param  ?string                      $declinedReason
     * @param  ?string                      $enrolledAt
     * @param  ?string                      $convertedAthleteId         Set on ENROLLED — links back to the created Athlete.
     * @param  ?string                      $convertedEnrollmentId
     * @param  ?string                      $convertedInvoiceId
     * @param  ?string                      $ownerUserId                Sales rep / admin assigned to move this through the funnel.
     * @param  ?string                      $sourceRefId                When source=external_crm — the external CRM's deal / opportunity ID.
     * @param  ?array                       $attribution                First-touch + last-touch marketing attribution captured at form submission.
     * @param  ?array                       $consentSnapshot            Consent flags at submission — photo / medical / marketing.
     * @param  ?string                      $notes
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $seasonId,

        #[StringType]
        public string $sportKey,

        #[StringType]
        public string $applicantFirstName,

        #[StringType]
        public string $applicantLastName,

        #[StringType]
        public string $applicantEmail,

        #[StringType]
        public string $athleteFirstName,

        #[StringType]
        public string $stage,

        #[StringType]
        public string $submittedAt,

        #[StringType]
        public string $source,

        #[StringType]
        public ?string $teamId = null,

        #[StringType]
        public ?string $branchId = null,

        #[StringType]
        public ?string $applicantPhone = null,

        #[StringType]
        public ?string $athleteLastName = null,

        #[StringType]
        public ?string $athleteDateOfBirth = null,

        #[StringType]
        public ?string $athleteGender = null,

        #[StringType]
        public ?string $expiresAt = null,

        #[StringType]
        public ?string $declinedAt = null,

        #[StringType]
        public ?string $declinedReason = null,

        #[StringType]
        public ?string $enrolledAt = null,

        #[StringType]
        public ?string $convertedAthleteId = null,

        #[StringType]
        public ?string $convertedEnrollmentId = null,

        #[StringType]
        public ?string $convertedInvoiceId = null,

        #[StringType]
        public ?string $ownerUserId = null,

        #[StringType]
        public ?string $sourceRefId = null,

        public ?array $attribution = null,

        public ?array $consentSnapshot = null,

        #[StringType]
        public ?string $notes = null,

        public ?array $metadata = null,
    ) {
    }
}
