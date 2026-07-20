<?php

declare(strict_types=1);

namespace Academorix\Athlete\Contracts\Services;

use Academorix\Athlete\Models\Athlete;
use Academorix\Athlete\Services\MedicalDisclosureGate;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for medical field READ authorisation.
 *
 * The four `medical_*` columns on an Athlete row
 * (`medical_conditions`, `medical_allergies`, `medical_medications`,
 * `medical_notes`) are PII+HEALTH. The gate answers "may this caller
 * SEE these fields for this athlete?" and short-circuits every DTO
 * that renders them.
 *
 * ## Authorisation policy
 *
 *   - **Platform / support-tooling caller** with
 *     `platform.athletes.audit-medical` — always allowed (auditor path).
 *   - **Coach on the athlete's team** with
 *     `athletes.view.medical.coach` AND
 *     `athlete.consent_medical_disclosure = true` — allowed.
 *   - **Self / linked adult athlete** with `athletes.view.medical.own` —
 *     allowed. When the athlete is a minor, the linked-guardian path
 *     (with legal custody) may substitute.
 *   - **Admin / staff** with `athletes.view.medical` — allowed.
 *   - Everyone else — denied. The AthleteData factory drops the
 *     medical block and returns nulls.
 *
 * The gate NEVER throws — it's read-side. A denied caller sees the
 * medical block replaced with nulls in the output DTO; the caller
 * won't know the row has medical data at all (defeats side-channel
 * leaks).
 *
 * @category Athlete
 *
 * @since    0.1.0
 */
#[Bind(MedicalDisclosureGate::class)]
interface MedicalDisclosureGateInterface
{
    /**
     * True when the given user id may READ medical fields for the athlete.
     *
     * @param  string|null  $viewerUserId  Caller's user id, or null for guest / system reads.
     */
    public function canViewMedical(Athlete $athlete, ?string $viewerUserId): bool;

    /**
     * True when the given user id may WRITE medical fields for the athlete.
     * Writes require `athletes.manage.medical` — this is a defense-in-depth
     * check on top of the AthleteObserver's write guard.
     */
    public function canWriteMedical(Athlete $athlete, ?string $viewerUserId): bool;
}
