<?php

declare(strict_types=1);

namespace Stackra\SportsSeasonSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \Stackra\Sports\Season\Models\Season}.
 *
 * Mirrors `schemas/season.schema.json` column-for-column, minus
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
 * use Stackra\SportsSdk\Client\SportsSdk;
 *
 * $row = app(SportsSdk::class)->season()->seasons()->show($id);
 * ```
 *
 * @category SeasonSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class SeasonData extends Data
{
    /**
     * @param  string                       $id                         Prefixed ULID: `sea_<26>`.
     * @param  string                       $tenantId
     * @param  string                       $name
     * @param  string                       $slug                       Unique per (tenant_id, organization_id, branch_id, slug) partial WHERE deleted_at IS NULL.
     * @param  string                       $seasonType                 Enum: annual / academic_year / summer_camp / winter_camp / half_year / quarter / trimester / custom.
     * @param  string                       $startDate
     * @param  string                       $endDate                    Must be > start_date.
     * @param  bool                         $hasPlayoffs
     * @param  string                       $status                     Enum: planned / registration_open / in_progress / playoffs / completed / archived.
     * @param  bool                         $isCurrent                  Exactly one is_current=true per (tenant, organization, branch, sport_key) tuple.
     * @param  int                          $sortOrder
     * @param  int                          $maxEnrollmentsPerAthlete   How many enrollments a single athlete can have this season (multi-sport athletes).
     * @param  bool                         $allowsLateRegistration
     * @param  int                          $lateRegistrationFeeCents
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $organizationId             Nullable = tenant-wide season.
     * @param  ?string                      $branchId                   Nullable = tenant-wide OR org-wide season.
     * @param  ?string                      $sportKey                   Wave 3c sports registry key.
     * @param  ?string                      $description
     * @param  ?string                      $registrationOpensAt
     * @param  ?string                      $registrationClosesAt
     * @param  ?string                      $lateRegistrationEndsAt     Grace window past registration_closes_at; requires allows_late_registration=true.
     * @param  ?string                      $competitionStartsAt        When actual competition/session series begins; may differ from start_date for training-first seasons.
     * @param  ?string                      $playoffStartsAt            Required when has_playoffs=true.
     * @param  ?string                      $playoffEndsAt
     * @param  ?string                      $primaryColor
     * @param  ?int                         $capacityTarget             Expected enrollment count for capacity planning.
     * @param  ?string                      $formId                     Optional binding to a `platform/forms::Form` (kind = season_registration).
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $createdBy
     * @param  ?string                      $updatedBy
     * @param  ?string                      $deletedBy
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $name,
        public string $slug,
        public string $seasonType,
        public string $startDate,
        public string $endDate,
        public bool $hasPlayoffs,
        public string $status,
        public bool $isCurrent,
        public int $sortOrder,
        public int $maxEnrollmentsPerAthlete,
        public bool $allowsLateRegistration,
        public int $lateRegistrationFeeCents,
        public string $createdAt,
        public string $updatedAt,
        public ?string $organizationId = null,
        public ?string $branchId = null,
        public ?string $sportKey = null,
        public ?string $description = null,
        public ?string $registrationOpensAt = null,
        public ?string $registrationClosesAt = null,
        public ?string $lateRegistrationEndsAt = null,
        public ?string $competitionStartsAt = null,
        public ?string $playoffStartsAt = null,
        public ?string $playoffEndsAt = null,
        public ?string $primaryColor = null,
        public ?int $capacityTarget = null,
        public ?string $formId = null,
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
