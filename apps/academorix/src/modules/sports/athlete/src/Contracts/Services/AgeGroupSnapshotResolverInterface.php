<?php

declare(strict_types=1);

namespace Academorix\Athlete\Contracts\Services;

use Academorix\Athlete\Services\AgeGroupSnapshotResolver;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for age-group snapshot resolution.
 *
 * Every athlete carries `current_age_group_id` +
 * `current_age_group_snapshot_at` — a MATERIALISED cache of the
 * age bucket that DOB places them in for the currently-configured
 * `age_groups` for the tenant. The snapshot lets the FE render
 * age-group filters without a per-request compute.
 *
 * Two consumers:
 *   - {@see \Academorix\Athlete\Services\AthleteProvisioner} calls this
 *     at create time to compute the initial snapshot.
 *   - `RollAthleteAgeGroupSnapshotJob` calls this per athlete at the
 *     season-boundary cutoff to roll every snapshot forward.
 *
 * @category Athlete
 *
 * @since    0.1.0
 */
#[Bind(AgeGroupSnapshotResolver::class)]
interface AgeGroupSnapshotResolverInterface
{
    /**
     * Resolve the age-group id that a given DOB maps to under the
     * tenant's active `age_groups` catalogue. Returns null when no
     * age group's `[min_age_inclusive, max_age_inclusive]` window
     * covers the derived age — the caller is expected to leave the
     * snapshot as-is in that case (nullable column).
     *
     * @param  string  $tenantId  Tenant whose age_groups are consulted.
     * @param  string  $dateOfBirth  ISO-8601 date string.
     * @return string|null  Age group id, or null when no bucket matches.
     */
    public function resolveForDateOfBirth(string $tenantId, string $dateOfBirth): ?string;

    /**
     * Resolve the age-group id for a whole-year age (skip parsing DOB
     * when the caller already knows the age).
     */
    public function resolveForAge(string $tenantId, int $ageYears): ?string;
}
