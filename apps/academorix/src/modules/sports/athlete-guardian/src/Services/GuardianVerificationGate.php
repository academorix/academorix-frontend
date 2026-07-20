<?php

declare(strict_types=1);

namespace Academorix\AthleteGuardian\Services;

use Academorix\AthleteGuardian\Contracts\Data\AthleteGuardianInterface;
use Academorix\AthleteGuardian\Contracts\Services\GuardianVerificationGateInterface;
use Academorix\AthleteGuardian\Enums\AthleteGuardianVerificationStatus;
use Academorix\AthleteGuardian\Models\AthleteGuardian;
use Illuminate\Container\Attributes\Scoped;

/**
 * Guardian-verification capability gate.
 *
 * Read-only — every `can*` method returns `bool` and never throws.
 * The Actions that write consent / medical / pickup / communications
 * call the gate first and then throw the appropriate domain
 * exception on refusal.
 *
 * ## Capability truth table
 *
 * | Guardian state                                        | consent | medical | pickup | comms |
 * |-------------------------------------------------------|---------|---------|--------|-------|
 * | Pending                                               |    ✗    |    ✗    |    ✗   |    ✗  |
 * | Verified, custody=true, medical=true                  |    ✓    |    ✓    |    ✓/✗ |    ✓/✗|
 * | Verified, custody=true, medical=false                 |    ✓    |    ✗    |    ✓/✗ |    ✓/✗|
 * | Verified, custody=false                               |    ✗    |    ✗    |    ✓/✗ |    ✓/✗|
 * | Disputed                                              |    ✗    |    ✗    |    ✗   |    ✗  |
 * | Revoked                                               |    ✗    |    ✗    |    ✗   |    ✗  |
 * | Row soft-deleted OR revoked_at set                    |    ✗    |    ✗    |    ✗   |    ✗  |
 *
 * `#[Scoped]` — stateless; scoped for uniform DI resolution.
 *
 * @category AthleteGuardian
 *
 * @since    0.1.0
 */
#[Scoped]
final class GuardianVerificationGate implements GuardianVerificationGateInterface
{
    /**
     * {@inheritDoc}
     */
    public function canRecordConsent(AthleteGuardian $guardian): bool
    {
        if (! $this->isActive($guardian)) {
            return false;
        }

        return (bool) $guardian->getAttribute(AthleteGuardianInterface::ATTR_HAS_LEGAL_CUSTODY);
    }

    /**
     * {@inheritDoc}
     */
    public function canAuthoriseMedical(AthleteGuardian $guardian): bool
    {
        if (! $this->isActive($guardian)) {
            return false;
        }

        return (bool) $guardian->getAttribute(AthleteGuardianInterface::ATTR_HAS_LEGAL_CUSTODY)
            && (bool) $guardian->getAttribute(AthleteGuardianInterface::ATTR_CAN_AUTHORISE_MEDICAL_CARE);
    }

    /**
     * {@inheritDoc}
     */
    public function canPickup(AthleteGuardian $guardian): bool
    {
        if (! $this->isActive($guardian)) {
            return false;
        }

        return (bool) $guardian->getAttribute(AthleteGuardianInterface::ATTR_CAN_PICKUP);
    }

    /**
     * {@inheritDoc}
     */
    public function canReceiveCommunications(AthleteGuardian $guardian): bool
    {
        if (! $this->isActive($guardian)) {
            return false;
        }

        return (bool) $guardian->getAttribute(AthleteGuardianInterface::ATTR_CAN_RECEIVE_COMMUNICATIONS);
    }

    /**
     * A row is "active" when it's Verified AND not revoked AND not deleted.
     * The three checks together are the base gate every capability check
     * layers on top of.
     */
    private function isActive(AthleteGuardian $guardian): bool
    {
        $status = $guardian->getAttribute(AthleteGuardianInterface::ATTR_VERIFICATION_STATUS);
        $statusValue = $status instanceof AthleteGuardianVerificationStatus
            ? $status
            : AthleteGuardianVerificationStatus::tryFrom((string) $status);

        if ($statusValue !== AthleteGuardianVerificationStatus::Verified) {
            return false;
        }

        if ($guardian->getAttribute(AthleteGuardianInterface::ATTR_REVOKED_AT) !== null) {
            return false;
        }

        if ($guardian->getAttribute(AthleteGuardianInterface::ATTR_DELETED_AT) !== null) {
            return false;
        }

        return true;
    }
}
