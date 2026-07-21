<?php

declare(strict_types=1);

namespace Stackra\Athlete\Contracts\Services;

use Stackra\Athlete\Models\Athlete;
use Stackra\Athlete\Services\AthleteConsentGate;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the consent-recorder authorisation gate.
 *
 * Every consent flag on an Athlete row (`consent_photo_release`,
 * `consent_medical_disclosure`, `consent_third_party`) MUST be
 * recorded by an authorised User:
 *
 *   - **Adult athlete** — the athlete themselves (matching User row)
 *     OR an admin acting on their behalf.
 *   - **Minor athlete** — an active, non-revoked
 *     {@see \Stackra\AthleteGuardian\Models\AthleteGuardian}
 *     row with `has_legal_custody = true` (the "consent" bit of the
 *     bundle) linked to the recorder's User id.
 *
 * The gate answers "is `$userId` allowed to record consent for
 * `$athlete`?" — no more, no less. The write itself lives in the
 * provisioner + the consent Action.
 *
 * Bound to the concrete via `#[Bind(AthleteConsentGate::class)]`.
 *
 * @category Athlete
 *
 * @since    0.1.0
 */
#[Bind(AthleteConsentGate::class)]
interface AthleteConsentGateInterface
{
    /**
     * Assert that `$recorderUserId` is authorised to record consent
     * for `$athlete`. Throws on refusal.
     *
     * @throws \Stackra\Athlete\Exceptions\AthleteConsentRecorderUnauthorisedException
     * @throws \Stackra\Athlete\Exceptions\UserIsMinorConsentRecorderException  When
     *         the recorder is themselves a minor athlete (indirect: recorder is a
     *         User row that is ALSO an Athlete row < 18).
     */
    public function assertRecorderAuthorised(Athlete $athlete, string $recorderUserId): void;

    /**
     * Non-throwing form. Returns true iff the caller is authorised.
     */
    public function canRecordConsent(Athlete $athlete, string $recorderUserId): bool;
}
