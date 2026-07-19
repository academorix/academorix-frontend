<?php

declare(strict_types=1);

namespace Academorix\SportsRegistrationsSdk\Payloads\Registrations;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/registrations/{id}` (or the
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
final class UpdateRegistrationPayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string                  $seasonId
     * @param  Optional|string|null             $teamId                     Optional — a registration may target a program rather than a specific team.
     * @param  Optional|string|null             $branchId
     * @param  Optional|string                  $sportKey
     * @param  Optional|string                  $applicantFirstName
     * @param  Optional|string                  $applicantLastName
     * @param  Optional|string                  $applicantEmail
     * @param  Optional|string|null             $applicantPhone
     * @param  Optional|string                  $athleteFirstName
     * @param  Optional|string|null             $athleteLastName
     * @param  Optional|string|null             $athleteDateOfBirth         Used by ValidateAgeAgainstSeason on trial + offer + convert transitions.
     * @param  Optional|string|null             $athleteGender
     * @param  Optional|string                  $stage
     * @param  Optional|string                  $submittedAt
     * @param  Optional|string|null             $expiresAt                  Auto-decline after 30d inactive by default.
     * @param  Optional|string|null             $declinedAt
     * @param  Optional|string|null             $declinedReason
     * @param  Optional|string|null             $enrolledAt
     * @param  Optional|string|null             $convertedAthleteId         Set on ENROLLED — links back to the created Athlete.
     * @param  Optional|string|null             $convertedEnrollmentId
     * @param  Optional|string|null             $convertedInvoiceId
     * @param  Optional|string|null             $ownerUserId                Sales rep / admin assigned to move this through the funnel.
     * @param  Optional|string                  $source                     web_form / referral / walk_in / cold_outreach / imported / crm_lead.
     * @param  Optional|string|null             $sourceRefId                When source=crm_lead — the growth::Lead ID.
     * @param  Optional|array|null              $attribution                First-touch + last-touch marketing attribution captured at form submission.
     * @param  Optional|array|null              $consentSnapshot            Consent flags at submission — photo / medical / marketing.
     * @param  Optional|string|null             $notes
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType]
        public Optional|string $tenantId = new Optional(),

        #[StringType]
        public Optional|string $seasonId = new Optional(),

        #[StringType]
        public Optional|string|null $teamId = new Optional(),

        #[StringType]
        public Optional|string|null $branchId = new Optional(),

        #[StringType]
        public Optional|string $sportKey = new Optional(),

        #[StringType]
        public Optional|string $applicantFirstName = new Optional(),

        #[StringType]
        public Optional|string $applicantLastName = new Optional(),

        #[StringType]
        public Optional|string $applicantEmail = new Optional(),

        #[StringType]
        public Optional|string|null $applicantPhone = new Optional(),

        #[StringType]
        public Optional|string $athleteFirstName = new Optional(),

        #[StringType]
        public Optional|string|null $athleteLastName = new Optional(),

        #[StringType]
        public Optional|string|null $athleteDateOfBirth = new Optional(),

        #[StringType]
        public Optional|string|null $athleteGender = new Optional(),

        #[StringType]
        public Optional|string $stage = new Optional(),

        #[StringType]
        public Optional|string $submittedAt = new Optional(),

        #[StringType]
        public Optional|string|null $expiresAt = new Optional(),

        #[StringType]
        public Optional|string|null $declinedAt = new Optional(),

        #[StringType]
        public Optional|string|null $declinedReason = new Optional(),

        #[StringType]
        public Optional|string|null $enrolledAt = new Optional(),

        #[StringType]
        public Optional|string|null $convertedAthleteId = new Optional(),

        #[StringType]
        public Optional|string|null $convertedEnrollmentId = new Optional(),

        #[StringType]
        public Optional|string|null $convertedInvoiceId = new Optional(),

        #[StringType]
        public Optional|string|null $ownerUserId = new Optional(),

        #[StringType]
        public Optional|string $source = new Optional(),

        #[StringType]
        public Optional|string|null $sourceRefId = new Optional(),

        public Optional|array|null $attribution = new Optional(),

        public Optional|array|null $consentSnapshot = new Optional(),

        #[StringType]
        public Optional|string|null $notes = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
