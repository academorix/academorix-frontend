<?php

declare(strict_types=1);

namespace Stackra\Athlete\Services;

use Stackra\Athlete\Contracts\Data\AthleteInterface;
use Stackra\Athlete\Contracts\Services\MedicalDisclosureGateInterface;
use Stackra\Athlete\Models\Athlete;
use Stackra\AthleteGuardian\Contracts\Data\AthleteGuardianInterface;
use Stackra\AthleteGuardian\Contracts\Repositories\AthleteGuardianRepositoryInterface;
use Stackra\AthleteGuardian\Enums\AthleteGuardianVerificationStatus;
use Illuminate\Container\Attributes\Scoped;

/**
 * Medical field READ authorisation gate.
 *
 * See {@see MedicalDisclosureGateInterface} for the authorisation
 * policy. Implementation notes:
 *
 * - The gate answers TRUE / FALSE only. No exceptions. Callers that
 *   need a hard-fail on a denied read (system reports) can wrap the
 *   `!canViewMedical()` return in their own throw.
 * - The Sanctum guard is consulted via `Gate::forUser($user)->allows(...)`.
 *   When there's no authenticated user, the gate returns false.
 * - The consent flag `athlete.consent_medical_disclosure` is the FINAL
 *   veto. A staff caller with the permission but a `consent_medical_disclosure
 *   = false` athlete is still denied. Admins have a super-user bypass via
 *   `athletes.audit.medical`, which the auditor role holds.
 *
 * `#[Scoped]` — reads request-scoped auth.
 *
 * @category Athlete
 *
 * @since    0.1.0
 */
#[Scoped]
final class MedicalDisclosureGate implements MedicalDisclosureGateInterface
{
    /**
     * @param  AthleteGuardianRepositoryInterface  $guardians  Guardian lookup boundary.
     */
    public function __construct(
        private readonly AthleteGuardianRepositoryInterface $guardians,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function canViewMedical(Athlete $athlete, ?string $viewerUserId): bool
    {
        // No caller, no read. Guest surface never sees medical.
        $user = auth()->user();
        if ($user === null || $viewerUserId === null) {
            return false;
        }

        // Platform / audit bypass — support tooling reads always land here.
        if ($this->userCan($user, 'platform.athletes.audit-medical')
            || $this->userCan($user, 'athletes.audit.medical')
        ) {
            return true;
        }

        $consentGranted = (bool) $athlete->getAttribute(AthleteInterface::ATTR_CONSENT_MEDICAL_DISCLOSURE);

        // Tenant admin / staff path — `athletes.view.medical` requires the
        // athlete's consent to disclose. Without consent the caller sees nothing.
        if ($this->userCan($user, 'athletes.view.medical') && $consentGranted) {
            return true;
        }

        // Self-view for adult athletes.
        if ($this->isSelf($athlete, $viewerUserId) && $this->userCan($user, 'athletes.view.medical.own')) {
            return true;
        }

        // Guardian-view for minors — the guardian must hold legal custody AND
        // be authorised for medical decisions AND the athlete's consent flag
        // must be set (a guardian without medical consent still can't read).
        if ($this->isGuardianWithMedicalAuthorisation($athlete, $viewerUserId)
            && $this->userCan($user, 'athletes.view.medical.own')
            && $consentGranted
        ) {
            return true;
        }

        // Coach path — must be on the athlete's team AND consent must be set.
        // We defer the roster membership lookup to a per-request cache
        // (via the sports/coaching module) — for now the coach path relies on
        // the permission AND consent flag together; the roster join lands
        // when sports/team's roster query is wired.
        if ($this->userCan($user, 'athletes.view.medical.coach') && $consentGranted) {
            return true;
        }

        return false;
    }

    /**
     * {@inheritDoc}
     */
    public function canWriteMedical(Athlete $athlete, ?string $viewerUserId): bool
    {
        $user = auth()->user();
        if ($user === null || $viewerUserId === null) {
            return false;
        }

        return $this->userCan($user, 'athletes.manage.medical');
    }

    /**
     * True when the athlete's linked User id matches the caller.
     */
    private function isSelf(Athlete $athlete, string $viewerUserId): bool
    {
        $athleteUserId = $athlete->getAttribute(AthleteInterface::ATTR_USER_ID);

        return $athleteUserId !== null && (string) $athleteUserId === $viewerUserId;
    }

    /**
     * True when the viewer holds an active guardian row on the athlete
     * with `can_authorise_medical_care = true` and legal custody.
     */
    private function isGuardianWithMedicalAuthorisation(Athlete $athlete, string $viewerUserId): bool
    {
        $tenantId = (string) $athlete->getAttribute(AthleteInterface::ATTR_TENANT_ID);

        return (bool) $this->guardians->query()
            ->where(AthleteGuardianInterface::ATTR_TENANT_ID, $tenantId)
            ->where(AthleteGuardianInterface::ATTR_ATHLETE_ID, (string) $athlete->getKey())
            ->where(AthleteGuardianInterface::ATTR_USER_ID, $viewerUserId)
            ->where(AthleteGuardianInterface::ATTR_HAS_LEGAL_CUSTODY, true)
            ->where(AthleteGuardianInterface::ATTR_CAN_AUTHORISE_MEDICAL_CARE, true)
            ->where(AthleteGuardianInterface::ATTR_VERIFICATION_STATUS, AthleteGuardianVerificationStatus::Verified->value)
            ->whereNull(AthleteGuardianInterface::ATTR_REVOKED_AT)
            ->whereNull(AthleteGuardianInterface::ATTR_DELETED_AT)
            ->exists();
    }

    /**
     * Thin wrapper over the framework `->can()` check. Extracted so the
     * gate is trivial to fake in unit tests.
     */
    private function userCan(mixed $user, string $ability): bool
    {
        return \is_object($user) && \method_exists($user, 'can') && (bool) $user->can($ability);
    }
}
