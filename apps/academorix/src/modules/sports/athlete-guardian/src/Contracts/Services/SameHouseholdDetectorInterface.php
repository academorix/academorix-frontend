<?php

declare(strict_types=1);

namespace Stackra\AthleteGuardian\Contracts\Services;

use Stackra\AthleteGuardian\Services\SameHouseholdDetector;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for same-household athlete detection.
 *
 * "Two athletes are in the same household" when there is at least
 * ONE User row that is an ACTIVE, non-revoked guardian on both
 * athletes. Used by:
 *
 *   - Sibling-discount rules in Finance (a family with 3 athletes
 *     may qualify for a per-athlete discount on the 2nd + 3rd).
 *   - Bulk notification suppression — don't send 3 separate emails
 *     to the same family when a policy change affects all 3
 *     athletes.
 *   - The FE's family-view helper — show all athletes tied to a
 *     given guardian's User account.
 *
 * @category AthleteGuardian
 *
 * @since    0.1.0
 */
#[Bind(SameHouseholdDetector::class)]
interface SameHouseholdDetectorInterface
{
    /**
     * True when the two athletes share at least one active guardian
     * User id inside the same tenant.
     */
    public function areInSameHousehold(string $tenantId, string $athleteA, string $athleteB): bool;

    /**
     * Return the set of athlete ids under `$tenantId` that share at
     * least one guardian with `$athleteId`. The returned list DOES
     * include `$athleteId` itself (they are always in the same
     * household as themselves).
     *
     * @return list<string>
     */
    public function siblingAthleteIds(string $tenantId, string $athleteId): array;
}
