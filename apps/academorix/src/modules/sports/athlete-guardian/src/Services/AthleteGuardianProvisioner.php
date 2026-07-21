<?php

declare(strict_types=1);

namespace Stackra\AthleteGuardian\Services;

use Stackra\AthleteGuardian\Contracts\Data\AthleteGuardianInterface;
use Stackra\AthleteGuardian\Contracts\Repositories\AthleteGuardianRepositoryInterface;
use Stackra\AthleteGuardian\Contracts\Services\AthleteGuardianProvisionerInterface;
use Stackra\AthleteGuardian\Contracts\Services\PrimaryGuardianResolverInterface;
use Stackra\AthleteGuardian\Enums\AthleteGuardianVerificationStatus;
use Stackra\AthleteGuardian\Exceptions\GuardianDuplicateException;
use Stackra\AthleteGuardian\Models\AthleteGuardian;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Support\Facades\DB;

/**
 * AthleteGuardian create-side orchestrator.
 *
 * ## Invariants enforced
 *
 *   - **Uniqueness** — a (tenant, athlete, user) triple can appear
 *     AT MOST ONCE as an active row. Duplicate creates throw
 *     `GuardianDuplicateException`.
 *   - **Exactly-one-primary** — when the caller sets `is_primary =
 *     true`, the current primary (if any) is flipped to false in the
 *     same transaction.
 *   - **Verification bootstrap** — every new row starts at
 *     `Pending`, regardless of what the caller passed. The
 *     `VerifyAction` is the ONE path to `Verified`.
 *
 * `#[Scoped]` — reads tenant scope through the repository.
 *
 * @category AthleteGuardian
 *
 * @since    0.1.0
 */
#[Scoped]
final class AthleteGuardianProvisioner implements AthleteGuardianProvisionerInterface
{
    /**
     * @param  AthleteGuardianRepositoryInterface  $guardians  Persistence boundary.
     * @param  PrimaryGuardianResolverInterface    $primary    Primary reassignment helper.
     */
    public function __construct(
        private readonly AthleteGuardianRepositoryInterface $guardians,
        private readonly PrimaryGuardianResolverInterface $primary,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function provision(array $attributes): AthleteGuardian
    {
        return DB::transaction(function () use ($attributes): AthleteGuardian {
            $tenantId = (string) ($attributes[AthleteGuardianInterface::ATTR_TENANT_ID] ?? '');
            $athleteId = (string) ($attributes[AthleteGuardianInterface::ATTR_ATHLETE_ID] ?? '');
            $userId = (string) ($attributes[AthleteGuardianInterface::ATTR_USER_ID] ?? '');

            $this->assertNotDuplicate($tenantId, $athleteId, $userId);

            // Force the verification lifecycle to start at Pending — callers
            // don't get to skip verification even if they pass a truthy value.
            $attributes[AthleteGuardianInterface::ATTR_VERIFICATION_STATUS] = AthleteGuardianVerificationStatus::Pending->value;

            // Default the boolean flags — the migration marks them non-null.
            $attributes[AthleteGuardianInterface::ATTR_IS_PRIMARY] ??= false;
            $attributes[AthleteGuardianInterface::ATTR_HAS_LEGAL_CUSTODY] ??= false;
            $attributes[AthleteGuardianInterface::ATTR_CAN_PICKUP] ??= false;
            $attributes[AthleteGuardianInterface::ATTR_CAN_RECEIVE_COMMUNICATIONS] ??= false;
            $attributes[AthleteGuardianInterface::ATTR_CAN_AUTHORISE_MEDICAL_CARE] ??= false;

            $primaryRequested = (bool) $attributes[AthleteGuardianInterface::ATTR_IS_PRIMARY];

            // Never create as primary in one shot — create as non-primary, then
            // flip via the resolver so the "exactly one primary" invariant is
            // preserved atomically (see reassignPrimary()).
            $attributes[AthleteGuardianInterface::ATTR_IS_PRIMARY] = false;

            /** @var AthleteGuardian $row */
            $row = $this->guardians->create($attributes);

            if ($primaryRequested) {
                $row = $this->primary->reassignPrimary($row);
            } elseif ($this->primary->primaryFor($tenantId, $athleteId) === null) {
                // No primary exists yet — the first row created for an athlete
                // is implicitly primary regardless of the caller's flag. This
                // ensures every athlete with at least one guardian has one.
                $row = $this->primary->reassignPrimary($row);
            }

            return $row;
        });
    }

    /**
     * Refuse a create when an active row already exists for the
     * (tenant, athlete, user) triple.
     */
    private function assertNotDuplicate(string $tenantId, string $athleteId, string $userId): void
    {
        $exists = $this->guardians->query()
            ->where(AthleteGuardianInterface::ATTR_TENANT_ID, $tenantId)
            ->where(AthleteGuardianInterface::ATTR_ATHLETE_ID, $athleteId)
            ->where(AthleteGuardianInterface::ATTR_USER_ID, $userId)
            ->whereNull(AthleteGuardianInterface::ATTR_REVOKED_AT)
            ->whereNull(AthleteGuardianInterface::ATTR_DELETED_AT)
            ->exists();

        if ($exists) {
            throw new GuardianDuplicateException(\sprintf(
                'A guardian row already exists for tenant %s / athlete %s / user %s. Update or revoke the existing row.',
                $tenantId,
                $athleteId,
                $userId,
            ));
        }
    }
}
