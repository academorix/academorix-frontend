<?php

declare(strict_types=1);

namespace Stackra\AthleteGuardian\Contracts\Services;

use Stackra\AthleteGuardian\Models\AthleteGuardian;
use Stackra\AthleteGuardian\Services\GuardianVerificationGate;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for guardian-verification state gating.
 *
 * A guardian row moves through the four-state verification lifecycle:
 *
 * ```
 *   Pending → Verified   (staff confirmed the relationship + custody doc)
 *   Pending → Disputed   (another guardian contested this row)
 *   Verified → Disputed  (post-verification dispute)
 *   Verified → Revoked   (custody transfer / court order)
 *   Disputed → Verified  (dispute resolved)
 *   Disputed → Revoked   (dispute upheld)
 * ```
 *
 * This gate answers "may this row transition to $target?" plus the
 * derived capability questions ("may this row exercise medical
 * authorisation?" — only when Verified + can_authorise_medical_care).
 *
 * Bound to the concrete via `#[Bind(GuardianVerificationGate::class)]`.
 *
 * @category AthleteGuardian
 *
 * @since    0.1.0
 */
#[Bind(GuardianVerificationGate::class)]
interface GuardianVerificationGateInterface
{
    /**
     * True when the guardian row is in a state that allows recording
     * consent on the linked athlete (i.e. `Verified` + not revoked +
     * `has_legal_custody = true`).
     */
    public function canRecordConsent(AthleteGuardian $guardian): bool;

    /**
     * True when the guardian row may authorise medical decisions
     * (`Verified` + `has_legal_custody = true` +
     * `can_authorise_medical_care = true`).
     */
    public function canAuthoriseMedical(AthleteGuardian $guardian): bool;

    /**
     * True when the guardian row may pick up the athlete
     * (`Verified` + `can_pickup = true`).
     */
    public function canPickup(AthleteGuardian $guardian): bool;

    /**
     * True when the guardian row may receive communications
     * (`Verified` + `can_receive_communications = true`).
     */
    public function canReceiveCommunications(AthleteGuardian $guardian): bool;
}
