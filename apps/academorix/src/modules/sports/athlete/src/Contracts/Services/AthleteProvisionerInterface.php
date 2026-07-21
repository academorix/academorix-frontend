<?php

declare(strict_types=1);

namespace Stackra\Athlete\Contracts\Services;

use Stackra\Athlete\Models\Athlete;
use Stackra\Athlete\Services\AthleteProvisioner;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the athlete create-side orchestrator.
 *
 * The provisioner is the ONE seam that CreateAthleteAction routes
 * through. It carries every write-path invariant that a plain
 * repository call cannot enforce:
 *
 *   - Guardian requirement for minors (per hierarchy.md §17 +
 *     security-compliance-reviewer P0). A create/update for an
 *     athlete under 18 is refused when no `AthleteGuardian` row
 *     exists.
 *   - Tenant / branch scope check — payload's `tenant_id` MUST
 *     match `Scope::currentTenantId()` OR the resolved active
 *     tenant. Cross-tenant writes throw `ApplicationMismatch`.
 *   - Slot check — hooks into `EntitlementGate::consume('athlete_slot')`
 *     inside the wrapping transaction so a rollback releases the
 *     slot.
 *   - Auto-provisioned defaults — `status = Pending` unless the
 *     caller flips it, `consent_recorded_at = null` until a
 *     guardian actually records consent, `current_age_group_id`
 *     computed from `date_of_birth` via
 *     `AgeGroupSnapshotResolver`.
 *
 * Bound to the concrete via `#[Bind(AthleteProvisioner::class)]`.
 *
 * @category Athlete
 *
 * @since    0.1.0
 */
#[Bind(AthleteProvisioner::class)]
interface AthleteProvisionerInterface
{
    /**
     * Persist a new Athlete row with every write-path invariant applied.
     *
     * @param  array<string, mixed>  $attributes  Column-keyed input from the validated request DTO.
     * @param  string|null           $recorderUserId  User id that submitted the create — used for the
     *                                                consent-recorder guard when the payload includes
     *                                                consent flags.
     * @return Athlete  The persisted row with computed defaults applied.
     *
     * @throws \Stackra\Athlete\Exceptions\AthleteGuardianRequiredException  Minor with no guardian on file.
     * @throws \Stackra\Athlete\Exceptions\AthleteDobOutOfBoundsException     DOB in the future or unreasonably old.
     * @throws \Stackra\Athlete\Exceptions\AthleteConsentRecorderUnauthorisedException  Recorder is not an
     *                                                                                    authorised guardian.
     */
    public function provision(array $attributes, ?string $recorderUserId = null): Athlete;

    /**
     * Apply the mutating fields of an update while re-checking every invariant that
     * could newly fail after the payload lands (date_of_birth change, guardian
     * revocation, medical fields written by non-medical caller).
     *
     * @param  Athlete               $athlete  Existing row.
     * @param  array<string, mixed>  $attributes  Partial column-keyed payload.
     * @param  string|null           $recorderUserId  Actor from the request scope.
     * @return Athlete  The updated row.
     *
     * @throws \Stackra\Athlete\Exceptions\AthleteGuardianRequiredException
     * @throws \Stackra\Athlete\Exceptions\AthleteMedicalPermissionRequiredException
     */
    public function update(Athlete $athlete, array $attributes, ?string $recorderUserId = null): Athlete;

    /**
     * Verify that the given athlete either has a linked adult identity
     * OR has at least one active, non-revoked AthleteGuardian row.
     *
     * Used by every write path that touches an athlete — status
     * transitions, consent recording, medical write, emergency
     * contact write.
     *
     * @throws \Stackra\Athlete\Exceptions\AthleteGuardianRequiredException
     */
    public function assertGuardianCoverage(Athlete $athlete): void;

    /**
     * True when the athlete's date_of_birth places them under 18 on the
     * provided reference date (defaults to today).
     */
    public function isMinor(Athlete $athlete, ?\DateTimeInterface $on = null): bool;
}
