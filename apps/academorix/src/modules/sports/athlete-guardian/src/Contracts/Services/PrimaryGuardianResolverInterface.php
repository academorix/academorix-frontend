<?php

declare(strict_types=1);

namespace Stackra\AthleteGuardian\Contracts\Services;

use Stackra\AthleteGuardian\Models\AthleteGuardian;
use Stackra\AthleteGuardian\Services\PrimaryGuardianResolver;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for deterministic primary-guardian resolution.
 *
 * An athlete has one primary guardian at a time — the row responsible
 * for the "who signs the waiver / receives billing" workflow. Two
 * questions:
 *
 *   1. Which existing row IS the primary today?
 *   2. If the primary is revoked / disputed / deleted, which of the
 *      remaining rows automatically becomes primary?
 *
 * Answering (1) is a simple `is_primary = true` lookup. Answering
 * (2) is the deterministic tie-breaker below:
 *
 *   1. Verified rows beat pending rows.
 *   2. Rows with `has_legal_custody = true` beat those without.
 *   3. Older rows (`created_at`) beat newer ones.
 *   4. Lower guardian id (ULID) beats higher (stable last-resort).
 *
 * Bound to the concrete via `#[Bind(PrimaryGuardianResolver::class)]`.
 *
 * @category AthleteGuardian
 *
 * @since    0.1.0
 */
#[Bind(PrimaryGuardianResolver::class)]
interface PrimaryGuardianResolverInterface
{
    /**
     * Return the athlete's current primary guardian row, or null when
     * no active guardian exists.
     */
    public function primaryFor(string $tenantId, string $athleteId): ?AthleteGuardian;

    /**
     * Return the row that WOULD become primary if the current primary
     * were revoked. Used by `RevokeAction` to decide whether the
     * revocation is safe (throws `GuardianAthleteWouldHaveNoPrimaryException`
     * when the answer is null AND the athlete is a minor).
     */
    public function nextPrimaryFor(string $tenantId, string $athleteId): ?AthleteGuardian;

    /**
     * Persist an atomic primary reassignment — flip the target row's
     * `is_primary = true` + flip any currently-primary row to
     * `is_primary = false`. Wrapped in a transaction so the invariant
     * "exactly one primary per athlete" always holds.
     *
     * @throws \Stackra\AthleteGuardian\Exceptions\GuardianAthleteAlreadyHasPrimaryException
     *         Only used for pathological states — see the code.
     */
    public function reassignPrimary(AthleteGuardian $target): AthleteGuardian;
}
