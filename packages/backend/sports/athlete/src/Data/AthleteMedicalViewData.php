<?php

declare(strict_types=1);

namespace Academorix\Athlete\Data;

use Academorix\Athlete\Contracts\Data\AthleteInterface;
use Academorix\Athlete\Contracts\Services\MedicalDisclosureGateInterface;
use Academorix\Athlete\Models\Athlete;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Medical-disclosure view of an Athlete row.
 *
 * The `medical_*` fields are gated behind
 * {@see MedicalDisclosureGateInterface} — the DTO factory calls the
 * gate per-request and drops the medical block for callers who
 * aren't authorised. **A denied caller cannot distinguish "no data"
 * from "not permitted"** — both paths return null, preventing
 * side-channel leaks.
 *
 * ## When to render
 *
 * Only the medical detail endpoint (`GET /athletes/{id}/medical`)
 * and the compliance audit endpoint (`GET /athletes/audit/medical`)
 * return this shape. Every other read path uses one of the
 * lower-privilege DTOs.
 *
 * @category Athlete
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
#[MapOutputName(SnakeCaseMapper::class)]
final class AthleteMedicalViewData extends Data
{
    /**
     * @param  string       $id
     * @param  string       $tenantId
     * @param  string       $firstName          Displayed alongside the medical block for context.
     * @param  string       $lastName
     * @param  bool         $consentGranted     Snapshot of `consent_medical_disclosure`.
     * @param  string|null  $consentRecordedAt  When the consent was captured.
     * @param  string|null  $medicalConditions  Free-form list — null when the gate denied.
     * @param  string|null  $medicalAllergies   Same.
     * @param  string|null  $medicalMedications Same.
     * @param  string|null  $medicalNotes       Same.
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $firstName,
        public string $lastName,
        public bool $consentGranted,
        public ?string $consentRecordedAt = null,
        public ?string $medicalConditions = null,
        public ?string $medicalAllergies = null,
        public ?string $medicalMedications = null,
        public ?string $medicalNotes = null,
    ) {
    }

    /**
     * Render an Athlete for a medical-role caller. Callers who fail
     * the gate see nulls in the four medical fields regardless of
     * their content on the row.
     */
    public static function fromModel(
        Athlete $a,
        MedicalDisclosureGateInterface $gate,
        ?string $viewerUserId,
    ): self {
        $canView = $gate->canViewMedical($a, $viewerUserId);

        return new self(
            id: (string) $a->getKey(),
            tenantId: (string) $a->getAttribute(AthleteInterface::ATTR_TENANT_ID),
            firstName: (string) $a->getAttribute(AthleteInterface::ATTR_FIRST_NAME),
            lastName: (string) $a->getAttribute(AthleteInterface::ATTR_LAST_NAME),
            consentGranted: (bool) $a->getAttribute(AthleteInterface::ATTR_CONSENT_MEDICAL_DISCLOSURE),
            consentRecordedAt: self::iso($a->getAttribute(AthleteInterface::ATTR_CONSENT_RECORDED_AT)),
            medicalConditions: $canView ? self::nullableString($a->getAttribute(AthleteInterface::ATTR_MEDICAL_CONDITIONS)) : null,
            medicalAllergies: $canView ? self::nullableString($a->getAttribute(AthleteInterface::ATTR_MEDICAL_ALLERGIES)) : null,
            medicalMedications: $canView ? self::nullableString($a->getAttribute(AthleteInterface::ATTR_MEDICAL_MEDICATIONS)) : null,
            medicalNotes: $canView ? self::nullableString($a->getAttribute(AthleteInterface::ATTR_MEDICAL_NOTES)) : null,
        );
    }

    /**
     * ISO-8601 formatter for timestamp-typed columns.
     */
    private static function iso(mixed $value): ?string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format(\DATE_ATOM);
        }

        return $value === null || $value === '' ? null : (string) $value;
    }

    private static function nullableString(mixed $value): ?string
    {
        return $value === null || $value === '' ? null : (string) $value;
    }
}
