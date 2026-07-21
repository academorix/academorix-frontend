<?php

declare(strict_types=1);

namespace Stackra\AthleteGuardian\Contracts\Services;

use Stackra\AthleteGuardian\Models\AthleteGuardian;
use Stackra\AthleteGuardian\Services\ConsentDelegationChain;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for guardian-to-athlete consent delegation.
 *
 * Answers the question: "given an athlete and a User attempting to
 * act on their behalf, which guardian row (if any) authorises the
 * action?" — plus a companion "who has consented to X on this
 * athlete's behalf" reverse lookup used by compliance / audit exports.
 *
 * Distinct from {@see GuardianVerificationGateInterface}: this class
 * looks up ROWS from (tenant, athlete, user); the gate answers
 * capability questions on ONE row.
 *
 * @category AthleteGuardian
 *
 * @since    0.1.0
 */
#[Bind(ConsentDelegationChain::class)]
interface ConsentDelegationChainInterface
{
    /**
     * Return the AthleteGuardian row that authorises `$userId` to
     * record consent for `$athleteId` under `$tenantId`, or null when
     * no such row exists.
     */
    public function delegationFor(string $tenantId, string $athleteId, string $userId): ?AthleteGuardian;

    /**
     * Return every AthleteGuardian row an athlete has that a
     * consent-recording caller could use — used for the "who
     * consented" audit trail.
     *
     * @return list<AthleteGuardian>
     */
    public function authoritativeChain(string $tenantId, string $athleteId): array;

    /**
     * Return the User ids that can currently record medical consent
     * for the athlete (verified + medical + custody).
     *
     * @return list<string>
     */
    public function medicalRecorderUserIds(string $tenantId, string $athleteId): array;
}
