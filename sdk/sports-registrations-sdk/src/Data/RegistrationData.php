<?php

declare(strict_types=1);

namespace Academorix\SportsRegistrationsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\Registration}.
 *
 * Mirrors `schemas/registration.schema.json` column-for-column, minus
 * the fields declared under `x-wire.hidden` which never leave the
 * server. Wire format is snake_case; PHP property names are
 * camelCase — the `SnakeCaseMapper` bridges the two.
 *
 * ## What this DTO owns
 *
 * A read-only, immutable projection of the row as the
 * Sports service emits it. Consumers never instantiate
 * this DTO by hand — the SDK's request classes hydrate it from the
 * response envelope inside `createDtoFromResponse()`.
 *
 * ## Example
 *
 * ```php
 * use Academorix\SportsSdk\Client\SportsSdk;
 *
 * $row = app(SportsSdk::class)->registrations()->registrations()->show($id);
 * ```
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class RegistrationData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $seasonId
     * @param  string                       $sportKey
     * @param  string                       $applicantFirstName
     * @param  string                       $applicantLastName
     * @param  string                       $applicantEmail
     * @param  string                       $athleteFirstName
     * @param  string                       $stage
     * @param  string                       $submittedAt
     * @param  string                       $source                     web_form / referral / walk_in / cold_outreach / imported / crm_lead.
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
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
     * @param  ?string                      $sourceRefId                When source=crm_lead — the growth::Lead ID.
     * @param  array<string, mixed>|null    $attribution                First-touch + last-touch marketing attribution captured at form submission.
     * @param  array<string, mixed>|null    $consentSnapshot            Consent flags at submission — photo / medical / marketing.
     * @param  ?string                      $notes
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $createdBy
     * @param  ?string                      $updatedBy
     * @param  ?string                      $deletedBy
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $seasonId,
        public string $sportKey,
        public string $applicantFirstName,
        public string $applicantLastName,
        public string $applicantEmail,
        public string $athleteFirstName,
        public string $stage,
        public string $submittedAt,
        public string $source,
        public string $createdAt,
        public string $updatedAt,
        public ?string $teamId = null,
        public ?string $branchId = null,
        public ?string $applicantPhone = null,
        public ?string $athleteLastName = null,
        public ?string $athleteDateOfBirth = null,
        public ?string $athleteGender = null,
        public ?string $expiresAt = null,
        public ?string $declinedAt = null,
        public ?string $declinedReason = null,
        public ?string $enrolledAt = null,
        public ?string $convertedAthleteId = null,
        public ?string $convertedEnrollmentId = null,
        public ?string $convertedInvoiceId = null,
        public ?string $ownerUserId = null,
        public ?string $sourceRefId = null,
        public ?array $attribution = null,
        public ?array $consentSnapshot = null,
        public ?string $notes = null,
        public ?array $metadata = null,
        public ?string $createdBy = null,
        public ?string $updatedBy = null,
        public ?string $deletedBy = null,
        public ?string $deletedAt = null,
    ) {
    }

    /**
     * Hydrate from a raw wire record (already unwrapped from the
     * `{ "data": ... }` envelope).
     *
     * @param  array<string, mixed>  $row  The raw snake_case record.
     * @return self                        The hydrated DTO.
     */
    public static function fromRecord(array $row): self
    {
        // Delegate to Spatie Data's canonical hydration path so
        // `#[MapInputName]` fires and every property is normalised
        // through the same mapper the response-side uses.
        return self::from($row);
    }
}
