<?php

declare(strict_types=1);

namespace Stackra\Athlete\Services;

use Stackra\Athlete\Contracts\Data\AthleteInterface;
use Stackra\Athlete\Contracts\Repositories\AthleteRepositoryInterface;
use Stackra\Athlete\Contracts\Services\AthleteConsentGateInterface;
use Stackra\Athlete\Exceptions\AthleteConsentRecorderUnauthorisedException;
use Stackra\Athlete\Exceptions\UserIsMinorConsentRecorderException;
use Stackra\Athlete\Models\Athlete;
use Stackra\AthleteGuardian\Contracts\Data\AthleteGuardianInterface;
use Stackra\AthleteGuardian\Contracts\Repositories\AthleteGuardianRepositoryInterface;
use Stackra\AthleteGuardian\Enums\AthleteGuardianVerificationStatus;
use Illuminate\Container\Attributes\Scoped;

/**
 * Consent-recorder authorisation gate.
 *
 * Answers the question: "is this User allowed to record a consent
 * flag on this Athlete?" The rules are the same across all three
 * consent flags — the caller is either (a) the athlete themselves
 * for an adult record, or (b) a linked, non-revoked, custody-holding
 * guardian for a minor record.
 *
 * ## Why a dedicated service
 *
 * The consent-recorder check is invoked from four call sites — the
 * provisioner (create/update), `RecordConsentAction`,
 * `RevokeConsentAction`, and the `RecordEmergencyContactAction`.
 * Centralising the rule in one class keeps them in sync and gives
 * the tests one place to fake.
 *
 * `#[Scoped]` — the check reads the current tenant scope via the
 * injected repositories.
 *
 * @category Athlete
 *
 * @since    0.1.0
 */
#[Scoped]
final class AthleteConsentGate implements AthleteConsentGateInterface
{
    /**
     * @param  AthleteRepositoryInterface           $athletes   Athlete persistence boundary.
     * @param  AthleteGuardianRepositoryInterface   $guardians  Guardian lookup boundary.
     */
    public function __construct(
        private readonly AthleteRepositoryInterface $athletes,
        private readonly AthleteGuardianRepositoryInterface $guardians,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function assertRecorderAuthorised(Athlete $athlete, string $recorderUserId): void
    {
        if (! $this->canRecordConsent($athlete, $recorderUserId)) {
            throw new AthleteConsentRecorderUnauthorisedException(\sprintf(
                'User %s is not authorised to record consent for athlete %s. Adult athletes record their own consent; minors require an active guardian with legal custody.',
                $recorderUserId,
                (string) $athlete->getKey(),
            ));
        }

        // Second guard — an adult recorder who happens to be a minor athlete
        // themselves cannot record for someone else (the recorder-is-a-minor
        // path). This catches the edge case where a 17-year-old sibling with
        // a User account tries to record for a 14-year-old.
        $this->assertRecorderIsNotAThemselvesMinor($recorderUserId, $athlete);
    }

    /**
     * {@inheritDoc}
     */
    public function canRecordConsent(Athlete $athlete, string $recorderUserId): bool
    {
        $tenantId = (string) $athlete->getAttribute(AthleteInterface::ATTR_TENANT_ID);
        $athleteUserId = $athlete->getAttribute(AthleteInterface::ATTR_USER_ID);

        // ── Adult path ────────────────────────────────────────────────
        // Adults record their own consent. If the athlete's linked User row
        // matches the recorder, the check passes regardless of guardian state.
        if ($this->isAdult($athlete) && $athleteUserId !== null && (string) $athleteUserId === $recorderUserId) {
            return true;
        }

        // ── Minor path (guardian must be verified + hold custody) ─────
        // Look up any active AthleteGuardian row for the (tenant, athlete,
        // recorder) triple that hasn't been revoked and holds legal custody
        // (has_legal_custody = true).
        $guardianRow = $this->guardians->query()
            ->where(AthleteGuardianInterface::ATTR_TENANT_ID, $tenantId)
            ->where(AthleteGuardianInterface::ATTR_ATHLETE_ID, (string) $athlete->getKey())
            ->where(AthleteGuardianInterface::ATTR_USER_ID, $recorderUserId)
            ->where(AthleteGuardianInterface::ATTR_HAS_LEGAL_CUSTODY, true)
            ->whereIn(AthleteGuardianInterface::ATTR_VERIFICATION_STATUS, [
                AthleteGuardianVerificationStatus::Verified->value,
            ])
            ->whereNull(AthleteGuardianInterface::ATTR_REVOKED_AT)
            ->whereNull(AthleteGuardianInterface::ATTR_DELETED_AT)
            ->exists();

        return (bool) $guardianRow;
    }

    /**
     * True when the athlete is at least 18 today.
     */
    private function isAdult(Athlete $athlete): bool
    {
        $dobRaw = $athlete->getAttribute(AthleteInterface::ATTR_DATE_OF_BIRTH);
        if ($dobRaw === null) {
            return false;
        }

        $dob = $dobRaw instanceof \DateTimeInterface
            ? $dobRaw
            : new \DateTimeImmutable((string) $dobRaw);

        return $dob->diff(new \DateTimeImmutable())->y >= 18;
    }

    /**
     * Refuse recording when the recorder is themselves a minor Athlete row.
     */
    private function assertRecorderIsNotAThemselvesMinor(string $recorderUserId, Athlete $target): void
    {
        $tenantId = (string) $target->getAttribute(AthleteInterface::ATTR_TENANT_ID);

        $recorderAsAthlete = $this->athletes->query()
            ->where(AthleteInterface::ATTR_TENANT_ID, $tenantId)
            ->where(AthleteInterface::ATTR_USER_ID, $recorderUserId)
            ->whereNull(AthleteInterface::ATTR_DELETED_AT)
            ->first();

        if ($recorderAsAthlete === null) {
            // Recorder isn't an athlete row — they can't be a minor athlete.
            return;
        }

        /** @var Athlete $recorderAsAthlete */
        if (! $this->isAdult($recorderAsAthlete)) {
            throw new UserIsMinorConsentRecorderException(\sprintf(
                'User %s is a minor athlete and cannot record consent for another athlete.',
                $recorderUserId,
            ));
        }
    }
}
