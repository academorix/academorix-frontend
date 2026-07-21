<?php

declare(strict_types=1);

namespace Academorix\AthleteGuardian\Services;

use Academorix\AthleteGuardian\Contracts\Data\AthleteGuardianInterface;
use Academorix\AthleteGuardian\Contracts\Repositories\AthleteGuardianRepositoryInterface;
use Academorix\AthleteGuardian\Contracts\Services\ConsentDelegationChainInterface;
use Academorix\AthleteGuardian\Enums\AthleteGuardianVerificationStatus;
use Academorix\AthleteGuardian\Models\AthleteGuardian;
use Illuminate\Container\Attributes\Scoped;

/**
 * Guardian-to-athlete consent delegation lookup.
 *
 * Three consumer paths:
 *
 *   - `delegationFor` — a write-path lookup used by consent Actions
 *     to find the specific row that authorises the caller.
 *   - `authoritativeChain` — an audit-side read that lists every
 *     guardian row an athlete has (used for the "who could have
 *     consented" trail in compliance exports).
 *   - `medicalRecorderUserIds` — used by the medical write path
 *     to render the FE's "who can update this record?" widget.
 *
 * `#[Scoped]` — reads tenant scope through the repository.
 *
 * @category AthleteGuardian
 *
 * @since    0.1.0
 */
#[Scoped]
final class ConsentDelegationChain implements ConsentDelegationChainInterface
{
    /**
     * @param  AthleteGuardianRepositoryInterface  $guardians  Persistence boundary.
     */
    public function __construct(
        private readonly AthleteGuardianRepositoryInterface $guardians,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function delegationFor(string $tenantId, string $athleteId, string $userId): ?AthleteGuardian
    {
        /** @var AthleteGuardian|null $row */
        $row = $this->guardians->query()
            ->where(AthleteGuardianInterface::ATTR_TENANT_ID, $tenantId)
            ->where(AthleteGuardianInterface::ATTR_ATHLETE_ID, $athleteId)
            ->where(AthleteGuardianInterface::ATTR_USER_ID, $userId)
            ->where(AthleteGuardianInterface::ATTR_VERIFICATION_STATUS, AthleteGuardianVerificationStatus::Verified->value)
            ->where(AthleteGuardianInterface::ATTR_HAS_LEGAL_CUSTODY, true)
            ->whereNull(AthleteGuardianInterface::ATTR_REVOKED_AT)
            ->whereNull(AthleteGuardianInterface::ATTR_DELETED_AT)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function authoritativeChain(string $tenantId, string $athleteId): array
    {
        /** @var array<int, AthleteGuardian> $rows */
        $rows = $this->guardians->query()
            ->where(AthleteGuardianInterface::ATTR_TENANT_ID, $tenantId)
            ->where(AthleteGuardianInterface::ATTR_ATHLETE_ID, $athleteId)
            ->whereIn(AthleteGuardianInterface::ATTR_VERIFICATION_STATUS, [
                AthleteGuardianVerificationStatus::Verified->value,
                AthleteGuardianVerificationStatus::Pending->value,
            ])
            ->whereNull(AthleteGuardianInterface::ATTR_REVOKED_AT)
            ->whereNull(AthleteGuardianInterface::ATTR_DELETED_AT)
            ->orderBy(AthleteGuardianInterface::ATTR_IS_PRIMARY, 'desc')
            ->orderBy(AthleteGuardianInterface::ATTR_CREATED_AT)
            ->get()
            ->all();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function medicalRecorderUserIds(string $tenantId, string $athleteId): array
    {
        /** @var array<int, object> $rows */
        $rows = $this->guardians->query()
            ->select(AthleteGuardianInterface::ATTR_USER_ID)
            ->where(AthleteGuardianInterface::ATTR_TENANT_ID, $tenantId)
            ->where(AthleteGuardianInterface::ATTR_ATHLETE_ID, $athleteId)
            ->where(AthleteGuardianInterface::ATTR_VERIFICATION_STATUS, AthleteGuardianVerificationStatus::Verified->value)
            ->where(AthleteGuardianInterface::ATTR_HAS_LEGAL_CUSTODY, true)
            ->where(AthleteGuardianInterface::ATTR_CAN_AUTHORISE_MEDICAL_CARE, true)
            ->whereNull(AthleteGuardianInterface::ATTR_REVOKED_AT)
            ->whereNull(AthleteGuardianInterface::ATTR_DELETED_AT)
            ->get()
            ->pluck(AthleteGuardianInterface::ATTR_USER_ID)
            ->all();

        return \array_values(\array_unique(\array_map(static fn ($v): string => (string) $v, $rows)));
    }
}
