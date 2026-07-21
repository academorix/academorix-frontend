<?php

declare(strict_types=1);

namespace Academorix\Athlete\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a create / update / consent write is attempted against
 * a minor athlete with no active, non-revoked
 * {@see \Academorix\AthleteGuardian\Models\AthleteGuardian} row on file.
 *
 * Per `.kiro/steering/hierarchy.md` §17 and the P0 finding from
 * `security-compliance-reviewer`, every write that touches a minor
 * MUST prove a guardian exists BEFORE the DB touch. The wrapping
 * transaction is aborted; the caller receives HTTP 422 with the
 * `ATHLETE_GUARDIAN_REQUIRED` error code so the FE can route the
 * user through the guardian-add wizard.
 *
 * @category Athlete
 *
 * @since    0.1.0
 */
final class AthleteGuardianRequiredException extends Exception
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'ATHLETE_GUARDIAN_REQUIRED';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'athlete::errors.ATHLETE_GUARDIAN_REQUIRED';

    /**
     * Factory used by the provisioner's guard clause. Attaches the
     * athlete id + age so the JSON envelope carries enough context
     * for the FE to render a targeted "add a guardian" call to
     * action without a follow-up request.
     *
     * @param  string  $athleteId  Athlete whose guardian coverage is missing.
     * @param  int     $ageYears   Whole-year age at the time of the check.
     */
    public static function forAthlete(string $athleteId, int $ageYears): self
    {
        return (new self(\sprintf(
            'Athlete %s is %d years old and requires at least one active guardian on file.',
            $athleteId,
            $ageYears,
        )))->withContext([
            'athlete_id' => $athleteId,
            'age_years' => $ageYears,
        ]);
    }
}
