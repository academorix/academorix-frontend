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
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/seasons/{id}` (or the
 * tenant-scoped equivalent).
 *
 * Partial-update semantics — every property is typed
 * `T|Optional|null` with an `Optional` sentinel default. Spatie
 * Data's `toArray()` strips `Optional` values, so unmentioned fields
 * are never emitted (never clear server-side state). Pass `null`
 * explicitly to clear a nullable column.
 *
 * @category SeasonSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class UpdateSeasonPayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string|null             $organizationId             Nullable = tenant-wide season.
     * @param  Optional|string|null             $branchId                   Nullable = tenant-wide OR org-wide season.
     * @param  Optional|string                  $name
     * @param  Optional|string                  $slug                       Unique per (tenant_id, organization_id, branch_id, slug) partial WHERE deleted_at IS NULL.
     * @param  Optional|string|null             $sportKey                   Wave 3c sports registry key.
     * @param  Optional|string|null             $description
     * @param  Optional|string                  $seasonType                 Enum: annual / academic_year / summer_camp / winter_camp / half_year / quarter / trimester / custom.
     * @param  Optional|string                  $startDate
     * @param  Optional|string                  $endDate                    Must be > start_date.
     * @param  Optional|string|null             $registrationOpensAt
     * @param  Optional|string|null             $registrationClosesAt
     * @param  Optional|string|null             $lateRegistrationEndsAt     Grace window past registration_closes_at; requires allows_late_registration=true.
     * @param  Optional|string|null             $competitionStartsAt        When actual competition/session series begins; may differ from start_date for training-first seasons.
     * @param  Optional|bool                    $hasPlayoffs
     * @param  Optional|string|null             $playoffStartsAt            Required when has_playoffs=true.
     * @param  Optional|string|null             $playoffEndsAt
     * @param  Optional|string                  $status                     Enum: planned / registration_open / in_progress / playoffs / completed / archived.
     * @param  Optional|bool                    $isCurrent                  Exactly one is_current=true per (tenant, organization, branch, sport_key) tuple.
     * @param  Optional|int                     $sortOrder
     * @param  Optional|string|null             $primaryColor
     * @param  Optional|int|null                $capacityTarget             Expected enrollment count for capacity planning.
     * @param  Optional|int                     $maxEnrollmentsPerAthlete   How many enrollments a single athlete can have this season (multi-sport athletes).
     * @param  Optional|bool                    $allowsLateRegistration
     * @param  Optional|int                     $lateRegistrationFeeCents
     * @param  Optional|string|null             $formId                     Optional binding to a `platform/forms::Form` (kind = season_registration).
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType, Regex('/^ten_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public Optional|string $tenantId = new Optional(),

        #[StringType, Regex('/^org_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public Optional|string|null $organizationId = new Optional(),

        #[StringType, Regex('/^brn_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public Optional|string|null $branchId = new Optional(),

        #[StringType, Min(2), Max(128)]
        public Optional|string $name = new Optional(),

        #[StringType, Min(2), Max(64), Regex('/^[a-z0-9]+(?:-[a-z0-9]+)*$/')]
        public Optional|string $slug = new Optional(),

        #[StringType, Max(32)]
        public Optional|string|null $sportKey = new Optional(),

        #[StringType]
        public Optional|string|null $description = new Optional(),

        #[StringType]
        public Optional|string $seasonType = new Optional(),

        #[StringType]
        public Optional|string $startDate = new Optional(),

        #[StringType]
        public Optional|string $endDate = new Optional(),

        #[StringType]
        public Optional|string|null $registrationOpensAt = new Optional(),

        #[StringType]
        public Optional|string|null $registrationClosesAt = new Optional(),

        #[StringType]
        public Optional|string|null $lateRegistrationEndsAt = new Optional(),

        #[StringType]
        public Optional|string|null $competitionStartsAt = new Optional(),

        public Optional|bool $hasPlayoffs = new Optional(),

        #[StringType]
        public Optional|string|null $playoffStartsAt = new Optional(),

        #[StringType]
        public Optional|string|null $playoffEndsAt = new Optional(),

        #[StringType]
        public Optional|string $status = new Optional(),

        public Optional|bool $isCurrent = new Optional(),

        public Optional|int $sortOrder = new Optional(),

        #[StringType, Regex('/^#[0-9A-Fa-f]{6}$/')]
        public Optional|string|null $primaryColor = new Optional(),

        public Optional|int|null $capacityTarget = new Optional(),

        public Optional|int $maxEnrollmentsPerAthlete = new Optional(),

        public Optional|bool $allowsLateRegistration = new Optional(),

        public Optional|int $lateRegistrationFeeCents = new Optional(),

        #[StringType]
        public Optional|string|null $formId = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
