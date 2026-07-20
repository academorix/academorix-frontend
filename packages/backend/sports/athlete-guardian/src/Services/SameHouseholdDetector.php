<?php

declare(strict_types=1);

namespace Academorix\AthleteGuardian\Services;

use Academorix\AthleteGuardian\Contracts\Data\AthleteGuardianInterface;
use Academorix\AthleteGuardian\Contracts\Repositories\AthleteGuardianRepositoryInterface;
use Academorix\AthleteGuardian\Contracts\Services\SameHouseholdDetectorInterface;
use Academorix\AthleteGuardian\Enums\AthleteGuardianVerificationStatus;
use Illuminate\Container\Attributes\Scoped;

/**
 * Same-household detector.
 *
 * Uses the shared-guardian-User-id definition:
 *
 *   > Two athletes are in the same household when the set of active
 *   > guardian User ids on athlete A intersects with the set on
 *   > athlete B.
 *
 * This is deliberately lax (a shared uncle counts as "same
 * household") because the downstream consumers (sibling-discount
 * rule, notification suppressor) prefer false positives to false
 * negatives — a family with an unusual guardian structure should
 * still get the discount.
 *
 * `#[Scoped]` — reads request-scoped tenant through the repository.
 *
 * @category AthleteGuardian
 *
 * @since    0.1.0
 */
#[Scoped]
final class SameHouseholdDetector implements SameHouseholdDetectorInterface
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
    public function areInSameHousehold(string $tenantId, string $athleteA, string $athleteB): bool
    {
        if ($athleteA === $athleteB) {
            return true;
        }

        $usersOfA = $this->activeGuardianUserIds($tenantId, $athleteA);
        if ($usersOfA === []) {
            return false;
        }

        $usersOfB = $this->activeGuardianUserIds($tenantId, $athleteB);
        if ($usersOfB === []) {
            return false;
        }

        // Intersect the two sets — a non-empty intersection is a shared guardian.
        return \array_intersect($usersOfA, $usersOfB) !== [];
    }

    /**
     * {@inheritDoc}
     */
    public function siblingAthleteIds(string $tenantId, string $athleteId): array
    {
        $userIds = $this->activeGuardianUserIds($tenantId, $athleteId);
        if ($userIds === []) {
            return [$athleteId];
        }

        /** @var array<int, object> $rows */
        $rows = $this->guardians->query()
            ->select(AthleteGuardianInterface::ATTR_ATHLETE_ID)
            ->where(AthleteGuardianInterface::ATTR_TENANT_ID, $tenantId)
            ->whereIn(AthleteGuardianInterface::ATTR_USER_ID, $userIds)
            ->where(AthleteGuardianInterface::ATTR_VERIFICATION_STATUS, AthleteGuardianVerificationStatus::Verified->value)
            ->whereNull(AthleteGuardianInterface::ATTR_REVOKED_AT)
            ->whereNull(AthleteGuardianInterface::ATTR_DELETED_AT)
            ->distinct()
            ->get()
            ->pluck(AthleteGuardianInterface::ATTR_ATHLETE_ID)
            ->all();

        // Coerce to strings + dedupe.
        $ids = \array_values(\array_unique(\array_map(static fn ($v): string => (string) $v, $rows)));

        // Ensure the seed athlete is always in the returned set.
        if (! \in_array($athleteId, $ids, true)) {
            $ids[] = $athleteId;
        }

        return $ids;
    }

    /**
     * Return the User ids that hold an active guardian row on the
     * given athlete.
     *
     * @return list<string>
     */
    private function activeGuardianUserIds(string $tenantId, string $athleteId): array
    {
        /** @var array<int, object> $rows */
        $rows = $this->guardians->query()
            ->select(AthleteGuardianInterface::ATTR_USER_ID)
            ->where(AthleteGuardianInterface::ATTR_TENANT_ID, $tenantId)
            ->where(AthleteGuardianInterface::ATTR_ATHLETE_ID, $athleteId)
            ->whereIn(AthleteGuardianInterface::ATTR_VERIFICATION_STATUS, [
                AthleteGuardianVerificationStatus::Verified->value,
                AthleteGuardianVerificationStatus::Pending->value,
            ])
            ->whereNull(AthleteGuardianInterface::ATTR_REVOKED_AT)
            ->whereNull(AthleteGuardianInterface::ATTR_DELETED_AT)
            ->get()
            ->pluck(AthleteGuardianInterface::ATTR_USER_ID)
            ->all();

        return \array_values(\array_unique(\array_map(static fn ($v): string => (string) $v, $rows)));
    }
}
