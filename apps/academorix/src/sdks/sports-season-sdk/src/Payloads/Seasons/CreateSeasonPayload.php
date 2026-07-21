<?php

declare(strict_types=1);

namespace Stackra\SportsSeasonSdk\Payloads\Seasons;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/seasons` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category SeasonSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateSeasonPayload extends Data
{
    /**
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
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType, Regex('/^ten_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public string $tenantId,

        #[StringType, Min(2), Max(128)]
        public string $name,

        #[StringType, Min(2), Max(64), Regex('/^[a-z0-9]+(?:-[a-z0-9]+)*$/')]
        public string $slug,

        #[StringType]
        public string $seasonType,

        #[StringType]
        public string $startDate,

        #[StringType]
        public string $endDate,

        public bool $hasPlayoffs,

        #[StringType]
        public string $status,

        public bool $isCurrent,

        public int $sortOrder,

        public int $maxEnrollmentsPerAthlete,

        public bool $allowsLateRegistration,

        public int $lateRegistrationFeeCents,

        #[StringType, Regex('/^org_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public ?string $organizationId = null,

        #[StringType, Regex('/^brn_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public ?string $branchId = null,

        #[StringType, Max(32)]
        public ?string $sportKey = null,

        #[StringType]
        public ?string $description = null,

        #[StringType]
        public ?string $registrationOpensAt = null,

        #[StringType]
        public ?string $registrationClosesAt = null,

        #[StringType]
        public ?string $lateRegistrationEndsAt = null,

        #[StringType]
        public ?string $competitionStartsAt = null,

        #[StringType]
        public ?string $playoffStartsAt = null,

        #[StringType]
        public ?string $playoffEndsAt = null,

        #[StringType, Regex('/^#[0-9A-Fa-f]{6}$/')]
        public ?string $primaryColor = null,

        public ?int $capacityTarget = null,

        #[StringType]
        public ?string $formId = null,

        public ?array $metadata = null,
    ) {
    }
}
