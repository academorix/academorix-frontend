<?php

declare(strict_types=1);

namespace Academorix\Athlete\Data;

use Academorix\Athlete\Contracts\Data\AthleteInterface;
use Academorix\Athlete\Contracts\Services\EmergencyContactGateInterface;
use Academorix\Athlete\Models\Athlete;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Coach-role view of an Athlete row.
 *
 * Extends the public-roster shape with:
 *
 *   - Demographics coaches need to assess (DOB, gender, dominant
 *     hand, height, weight, primary language).
 *   - Emergency contact fields (gated through
 *     {@see EmergencyContactGateInterface} — the DTO factory drops
 *     the block for callers who lack the permission).
 *
 * Never carries medical PII — that's {@see AthleteMedicalViewData}.
 * Never carries the consent-snapshot columns — those live on the
 * consent listing endpoint.
 *
 * @category Athlete
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
#[MapOutputName(SnakeCaseMapper::class)]
final class AthleteCoachViewData extends Data
{
    /**
     * @param  string       $id
     * @param  string       $tenantId
     * @param  string       $branchId
     * @param  string       $firstName
     * @param  string       $lastName
     * @param  string       $dateOfBirth
     * @param  string       $status
     * @param  string       $createdAt
     * @param  string       $updatedAt
     * @param  string|null  $preferredName
     * @param  string|null  $gender
     * @param  string|null  $pronouns
     * @param  int|null     $heightCm
     * @param  int|null     $weightKg
     * @param  string|null  $dominantHand
     * @param  string|null  $primaryLanguage
     * @param  string|null  $profilePhotoUrl
     * @param  string|null  $currentAgeGroupId
     * @param  string|null  $emergencyContactName          Present only when the emergency-contact gate returned true.
     * @param  string|null  $emergencyContactPhone         Same.
     * @param  string|null  $emergencyContactRelationship  Same.
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $branchId,
        public string $firstName,
        public string $lastName,
        public string $dateOfBirth,
        public string $status,
        public string $createdAt,
        public string $updatedAt,
        public ?string $preferredName = null,
        public ?string $gender = null,
        public ?string $pronouns = null,
        public ?int $heightCm = null,
        public ?int $weightKg = null,
        public ?string $dominantHand = null,
        public ?string $primaryLanguage = null,
        public ?string $profilePhotoUrl = null,
        public ?string $currentAgeGroupId = null,
        public ?string $emergencyContactName = null,
        public ?string $emergencyContactPhone = null,
        public ?string $emergencyContactRelationship = null,
    ) {
    }

    /**
     * Render an Athlete for a coach-role caller. The emergency-contact
     * block is gated per-call: callers who lack the permission see nulls
     * in the three EC fields. The rest of the payload is always emitted.
     */
    public static function fromModel(
        Athlete $a,
        EmergencyContactGateInterface $ecGate,
        ?string $viewerUserId,
    ): self {
        $ecVisible = $ecGate->canViewEmergencyContact($a, $viewerUserId);

        return new self(
            id: (string) $a->getKey(),
            tenantId: (string) $a->getAttribute(AthleteInterface::ATTR_TENANT_ID),
            branchId: (string) ($a->getAttribute(AthleteInterface::ATTR_BRANCH_ID) ?? ''),
            firstName: (string) $a->getAttribute(AthleteInterface::ATTR_FIRST_NAME),
            lastName: (string) $a->getAttribute(AthleteInterface::ATTR_LAST_NAME),
            dateOfBirth: self::asDateString($a->getAttribute(AthleteInterface::ATTR_DATE_OF_BIRTH)),
            status: (string) $a->getAttribute(AthleteInterface::ATTR_STATUS),
            createdAt: self::iso($a->getAttribute(AthleteInterface::ATTR_CREATED_AT)),
            updatedAt: self::iso($a->getAttribute(AthleteInterface::ATTR_UPDATED_AT)),
            preferredName: self::nullableString($a->getAttribute(AthleteInterface::ATTR_PREFERRED_NAME)),
            gender: self::enumValue($a->getAttribute(AthleteInterface::ATTR_GENDER)),
            pronouns: self::nullableString($a->getAttribute(AthleteInterface::ATTR_PRONOUNS)),
            heightCm: self::nullableInt($a->getAttribute(AthleteInterface::ATTR_HEIGHT_CM)),
            weightKg: self::nullableInt($a->getAttribute(AthleteInterface::ATTR_WEIGHT_KG)),
            dominantHand: self::enumValue($a->getAttribute(AthleteInterface::ATTR_DOMINANT_HAND)),
            primaryLanguage: self::nullableString($a->getAttribute(AthleteInterface::ATTR_PRIMARY_LANGUAGE)),
            profilePhotoUrl: self::nullableString($a->getAttribute(AthleteInterface::ATTR_PROFILE_PHOTO_URL)),
            currentAgeGroupId: self::nullableString($a->getAttribute(AthleteInterface::ATTR_CURRENT_AGE_GROUP_ID)),
            emergencyContactName: $ecVisible ? self::nullableString($a->getAttribute(AthleteInterface::ATTR_EMERGENCY_CONTACT_NAME)) : null,
            emergencyContactPhone: $ecVisible ? self::nullableString($a->getAttribute(AthleteInterface::ATTR_EMERGENCY_CONTACT_PHONE)) : null,
            emergencyContactRelationship: $ecVisible ? self::nullableString($a->getAttribute(AthleteInterface::ATTR_EMERGENCY_CONTACT_RELATIONSHIP)) : null,
        );
    }

    // ── helpers ──────────────────────────────────────────────

    private static function iso(mixed $value): string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format(\DATE_ATOM);
        }

        return $value === null ? '' : (string) $value;
    }

    private static function asDateString(mixed $value): string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        return $value === null ? '' : (string) $value;
    }

    private static function nullableString(mixed $value): ?string
    {
        return $value === null || $value === '' ? null : (string) $value;
    }

    private static function nullableInt(mixed $value): ?int
    {
        return $value === null || $value === '' ? null : (int) $value;
    }

    /**
     * Coerce an enum-cast value (e.g. AthleteGender) to its backing string.
     */
    private static function enumValue(mixed $value): ?string
    {
        if ($value instanceof \BackedEnum) {
            return (string) $value->value;
        }

        return self::nullableString($value);
    }
}
