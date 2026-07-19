<?php

declare(strict_types=1);

namespace Academorix\GrowthCrmLeadsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\Lead}.
 *
 * Mirrors `schemas/lead.schema.json` column-for-column, minus
 * the fields declared under `x-wire.hidden` which never leave the
 * server. Wire format is snake_case; PHP property names are
 * camelCase — the `SnakeCaseMapper` bridges the two.
 *
 * ## What this DTO owns
 *
 * A read-only, immutable projection of the row as the
 * Growth service emits it. Consumers never instantiate
 * this DTO by hand — the SDK's request classes hydrate it from the
 * response envelope inside `createDtoFromResponse()`.
 *
 * ## Example
 *
 * ```php
 * use Academorix\GrowthSdk\Client\GrowthSdk;
 *
 * $row = app(GrowthSdk::class)->crmLeads()->leads()->show($id);
 * ```
 *
 * @category CrmLeadsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class LeadData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $firstName
     * @param  string                       $source                     web_form / referral / walk_in / cold_outreach / campaign_{key}.
     * @param  string                       $stage
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
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
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $firstName,
        public string $source,
        public string $stage,
        public string $createdAt,
        public string $updatedAt,
        public ?string $lastName = null,
        public ?string $email = null,
        public ?string $phone = null,
        public ?string $campaignId = null,
        public ?string $referralCodeId = null,
        public ?string $sportInterest = null,
        public ?int $ageOfAthlete = null,
        public ?string $ownerUserId = null,
        public ?string $firstContactAt = null,
        public ?string $convertedAt = null,
        public ?string $convertedAthleteId = null,
        public ?string $lostAt = null,
        public ?string $lostReason = null,
        public ?int $score = null,
        public ?string $notes = null,
        public ?array $metadata = null,
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
