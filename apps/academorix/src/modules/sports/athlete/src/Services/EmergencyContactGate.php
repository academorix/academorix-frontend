<?php

declare(strict_types=1);

namespace Academorix\Athlete\Services;

use Academorix\Athlete\Contracts\Data\AthleteInterface;
use Academorix\Athlete\Contracts\Services\EmergencyContactGateInterface;
use Academorix\Athlete\Models\Athlete;
use Academorix\AthleteGuardian\Contracts\Data\AthleteGuardianInterface;
use Academorix\AthleteGuardian\Contracts\Repositories\AthleteGuardianRepositoryInterface;
use Academorix\AthleteGuardian\Enums\AthleteGuardianVerificationStatus;
use Illuminate\Container\Attributes\Scoped;

/**
 * Emergency-contact field READ authorisation gate.
 *
 * See {@see EmergencyContactGateInterface} for the policy. Unlike
 * the medical gate, this one does NOT require an athlete-side
 * consent flag — registering an emergency contact IS the consent
 * for that contact to be used.
 *
 * `#[Scoped]` — reads request-scoped auth.
 *
 * @category Athlete
 *
 * @since    0.1.0
 */
#[Scoped]
final class EmergencyContactGate implements EmergencyContactGateInterface
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
    public function canViewEmergencyContact(Athlete $athlete, ?string $viewerUserId): bool
    {
        $user = auth()->user();
        if ($user === null || $viewerUserId === null) {
            return false;
        }

        // Broad staff / coach path — one permission covers admin, coach, HR.
        if ($this->userCan($user, 'athletes.view.emergency_contact')) {
            return true;
        }

        // Self-view for adult athletes.
        if ($this->isSelf($athlete, $viewerUserId)
            && $this->userCan($user, 'athletes.view.emergency_contact.own')
        ) {
            return true;
        }

        // Guardian-view for minors.
        if ($this->isGuardian($athlete, $viewerUserId)
            && $this->userCan($user, 'athletes.view.emergency_contact.own')
        ) {
            return true;
        }

        return false;
    }

    /**
     * {@inheritDoc}
     */
    public function canWriteEmergencyContact(Athlete $athlete, ?string $viewerUserId): bool
    {
        $user = auth()->user();
        if ($user === null || $viewerUserId === null) {
            return false;
        }

        if ($this->userCan($user, 'athletes.manage.emergency_contact')) {
            return true;
        }

        // Guardian / adult self-manage path.
        $isEligibleSelf = $this->isSelf($athlete, $viewerUserId);
        $isEligibleGuardian = $this->isGuardian($athlete, $viewerUserId);

        return ($isEligibleSelf || $isEligibleGuardian)
            && $this->userCan($user, 'athletes.manage.emergency_contact.own');
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
     * True when the viewer is an active, non-revoked guardian on the athlete.
     * Legal custody is NOT required — emergency contact is broader (any
     * verified guardian can see the contact so they can reach the athlete).
     */
    private function isGuardian(Athlete $athlete, string $viewerUserId): bool
    {
        $tenantId = (string) $athlete->getAttribute(AthleteInterface::ATTR_TENANT_ID);

        return (bool) $this->guardians->query()
            ->where(AthleteGuardianInterface::ATTR_TENANT_ID, $tenantId)
            ->where(AthleteGuardianInterface::ATTR_ATHLETE_ID, (string) $athlete->getKey())
            ->where(AthleteGuardianInterface::ATTR_USER_ID, $viewerUserId)
            ->whereIn(AthleteGuardianInterface::ATTR_VERIFICATION_STATUS, [
                AthleteGuardianVerificationStatus::Verified->value,
                AthleteGuardianVerificationStatus::Pending->value,
            ])
            ->whereNull(AthleteGuardianInterface::ATTR_REVOKED_AT)
            ->whereNull(AthleteGuardianInterface::ATTR_DELETED_AT)
            ->exists();
    }

    /**
     * Thin wrapper over `->can()` — extracted so the gate is trivial to fake.
     */
    private function userCan(mixed $user, string $ability): bool
    {
        return \is_object($user) && \method_exists($user, 'can') && (bool) $user->can($ability);
    }
}
