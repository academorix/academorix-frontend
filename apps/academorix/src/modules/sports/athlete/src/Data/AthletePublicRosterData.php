<?php

declare(strict_types=1);

namespace Stackra\Athlete\Data;

use Stackra\Athlete\Contracts\Data\AthleteInterface;
use Stackra\Athlete\Models\Athlete;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Least-privilege view of an Athlete — for surfaces like coach
 * rosters, team lists, and event line-ups where any authenticated
 * tenant caller sees the row.
 *
 * Deliberately omits emergency contact, medical, consent metadata,
 * and demographic fields (`gender`, `date_of_birth`,
 * `pronouns`, `height_cm`, `weight_kg`, ...). If the caller needs
 * those, they read one of the higher-privilege DTOs
 * ({@see AthleteCoachViewData} / {@see AthleteMedicalViewData}).
 *
 * The FE renders this DTO from every list endpoint by default; the
 * detail view routes call the appropriate role-scoped DTO based on
 * the caller's permissions.
 *
 * @category Athlete
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
#[MapOutputName(SnakeCaseMapper::class)]
final class AthletePublicRosterData extends Data
{
    /**
     * @param  string       $id                Prefixed ULID (`ath_*`).
     * @param  string       $tenantId          Owning tenant.
     * @param  string       $branchId          Physical venue.
     * @param  string       $firstName         Given name.
     * @param  string       $lastName          Family name.
     * @param  string       $status            AthleteStatus backing value.
     * @param  string       $createdAt         ISO-8601 creation timestamp.
     * @param  string       $updatedAt         ISO-8601 last-mutation timestamp.
     * @param  string|null  $preferredName     Display name preference.
     * @param  string|null  $profilePhotoUrl   Signed URL — 15-minute TTL.
     * @param  string|null  $currentAgeGroupId Materialised age-group id.
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $branchId,
        public string $firstName,
        public string $lastName,
        public string $status,
        public string $createdAt,
        public string $updatedAt,
        public ?string $preferredName = null,
        public ?string $profilePhotoUrl = null,
        public ?string $currentAgeGroupId = null,
    ) {
    }

    /**
     * Render an Athlete model as a public-roster DTO. Safe for any
     * authenticated tenant caller — no PII beyond names.
     */
    public static function fromModel(Athlete $a): self
    {
        return new self(
            id: (string) $a->getKey(),
            tenantId: (string) $a->getAttribute(AthleteInterface::ATTR_TENANT_ID),
            branchId: (string) ($a->getAttribute(AthleteInterface::ATTR_BRANCH_ID) ?? ''),
            firstName: (string) $a->getAttribute(AthleteInterface::ATTR_FIRST_NAME),
            lastName: (string) $a->getAttribute(AthleteInterface::ATTR_LAST_NAME),
            status: (string) $a->getAttribute(AthleteInterface::ATTR_STATUS),
            createdAt: self::iso($a->getAttribute(AthleteInterface::ATTR_CREATED_AT)),
            updatedAt: self::iso($a->getAttribute(AthleteInterface::ATTR_UPDATED_AT)),
            preferredName: self::nullableString($a->getAttribute(AthleteInterface::ATTR_PREFERRED_NAME)),
            profilePhotoUrl: self::nullableString($a->getAttribute(AthleteInterface::ATTR_PROFILE_PHOTO_URL)),
            currentAgeGroupId: self::nullableString($a->getAttribute(AthleteInterface::ATTR_CURRENT_AGE_GROUP_ID)),
        );
    }

    /**
     * ISO-8601 formatter for possibly-string possibly-DateTime values
     * coming off the model.
     */
    private static function iso(mixed $value): string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format(\DATE_ATOM);
        }
        if ($value === null || $value === '') {
            return '';
        }

        return (string) $value;
    }

    /**
     * Coerce empty strings to null for optional string outputs.
     */
    private static function nullableString(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }
}
