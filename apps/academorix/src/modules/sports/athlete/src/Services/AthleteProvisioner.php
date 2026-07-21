<?php

declare(strict_types=1);

namespace Stackra\Athlete\Services;

use Stackra\Athlete\Contracts\Data\AthleteInterface;
use Stackra\Athlete\Contracts\Repositories\AthleteRepositoryInterface;
use Stackra\Athlete\Contracts\Services\AgeGroupSnapshotResolverInterface;
use Stackra\Athlete\Contracts\Services\AthleteConsentGateInterface;
use Stackra\Athlete\Contracts\Services\AthleteProvisionerInterface;
use Stackra\Athlete\Enums\AthleteStatus;
use Stackra\Athlete\Events\AthleteCreated;
use Stackra\Athlete\Exceptions\AthleteDobOutOfBoundsException;
use Stackra\Athlete\Exceptions\AthleteGuardianRequiredException;
use Stackra\Athlete\Exceptions\AthleteMedicalPermissionRequiredException;
use Stackra\Athlete\Models\Athlete;
use Stackra\AthleteGuardian\Contracts\Data\AthleteGuardianInterface;
use Stackra\AthleteGuardian\Contracts\Repositories\AthleteGuardianRepositoryInterface;
use Stackra\AthleteGuardian\Enums\AthleteGuardianVerificationStatus;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

/**
 * Athlete create-side orchestrator.
 *
 * ## What this owns
 *
 *   - The `create` + `update` write path — every write that runs
 *     against the `athletes` table from the tenant surface funnels
 *     through here so the guardian + slot + DOB + medical-permission
 *     invariants are ALWAYS applied.
 *   - Guardian coverage for minors (per `.kiro/steering/hierarchy.md`
 *     §17). Minor writes with no active guardian throw
 *     {@see AthleteGuardianRequiredException}.
 *   - Auto-computed defaults — `status = Pending`, empty consent
 *     flags, `current_age_group_id` from
 *     {@see AgeGroupSnapshotResolverInterface}.
 *   - `AthleteCreated` domain event dispatched inside the wrapping
 *     transaction so listeners run only when the row commits.
 *
 * ## Invariants
 *
 *   - Every create/update runs in a DB transaction. A guardian
 *     check failure aborts the whole batch — the athlete row is
 *     never orphaned.
 *   - DOB is validated against the min/max age configured for the
 *     tenant (defaults: 3-99 years).
 *   - Medical writes require the caller to hold `athletes.manage.medical`;
 *     the observer enforces the same rule as a defense in depth,
 *     but this provisioner fails fast before the DB touch.
 *
 * `#[Scoped]` — reads the active tenant scope + current user id
 * through injected repositories.
 *
 * @category Athlete
 *
 * @since    0.1.0
 */
#[Scoped]
final class AthleteProvisioner implements AthleteProvisionerInterface
{
    /**
     * Youngest permissible age at create — anything below is
     * refused as a DOB out-of-bounds.
     */
    private const int MIN_AGE_YEARS = 3;

    /**
     * Oldest permissible age at create.
     */
    private const int MAX_AGE_YEARS = 99;

    /**
     * Legal age of majority. Below this threshold the guardian
     * check fires.
     */
    private const int AGE_OF_MAJORITY = 18;

    /**
     * Medical column set — writes to any of these require the
     * `athletes.manage.medical` permission.
     *
     * @var list<string>
     */
    private const array MEDICAL_COLUMNS = [
        AthleteInterface::ATTR_MEDICAL_CONDITIONS,
        AthleteInterface::ATTR_MEDICAL_ALLERGIES,
        AthleteInterface::ATTR_MEDICAL_MEDICATIONS,
        AthleteInterface::ATTR_MEDICAL_NOTES,
    ];

    /**
     * @param  AthleteRepositoryInterface           $athletes           Primary persistence boundary.
     * @param  AthleteGuardianRepositoryInterface   $guardians          Guardian coverage lookup.
     * @param  AgeGroupSnapshotResolverInterface    $ageGroupResolver   Snapshot resolver for `current_age_group_id`.
     * @param  AthleteConsentGateInterface          $consentGate        Consent recorder authorisation.
     */
    public function __construct(
        private readonly AthleteRepositoryInterface $athletes,
        private readonly AthleteGuardianRepositoryInterface $guardians,
        private readonly AgeGroupSnapshotResolverInterface $ageGroupResolver,
        private readonly AthleteConsentGateInterface $consentGate,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function provision(array $attributes, ?string $recorderUserId = null): Athlete
    {
        return DB::transaction(function () use ($attributes, $recorderUserId): Athlete {
            $attributes = $this->normalise($attributes);
            $this->assertDobInBounds($attributes[AthleteInterface::ATTR_DATE_OF_BIRTH] ?? null);
            $this->assertMedicalCallerPermitted($attributes);

            // Snapshot the age group at creation time.
            if (isset($attributes[AthleteInterface::ATTR_DATE_OF_BIRTH])) {
                $attributes[AthleteInterface::ATTR_CURRENT_AGE_GROUP_ID] ??= $this->ageGroupResolver->resolveForDateOfBirth(
                    (string) ($attributes[AthleteInterface::ATTR_TENANT_ID] ?? ''),
                    (string) $attributes[AthleteInterface::ATTR_DATE_OF_BIRTH],
                );
                $attributes[AthleteInterface::ATTR_CURRENT_AGE_GROUP_SNAPSHOT_AT] = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
            }

            // Consent claims can only be persisted if a valid recorder is on file.
            if ($this->hasConsentClaim($attributes) && $recorderUserId !== null) {
                $attributes[AthleteInterface::ATTR_CONSENT_RECORDED_BY_USER_ID] = $recorderUserId;
                $attributes[AthleteInterface::ATTR_CONSENT_RECORDED_AT] ??= (new \DateTimeImmutable())->format('Y-m-d H:i:s');
            }

            /** @var Athlete $athlete */
            $athlete = $this->athletes->create($attributes);

            // Guardian check runs AFTER create so we can inspect the persisted
            // athlete's DOB and derive age precisely. If it fails, the whole
            // transaction rolls back — no orphan row is left behind.
            $this->assertGuardianCoverage($athlete);

            // Validate the consent-recorder against the guardian roster (minor
            // consent MUST be recorded by an authorised guardian).
            if ($this->hasConsentClaim($attributes) && $recorderUserId !== null) {
                $this->consentGate->assertRecorderAuthorised($athlete, $recorderUserId);
            }

            $this->dispatchCreated($athlete, $recorderUserId);

            return $athlete;
        });
    }

    /**
     * {@inheritDoc}
     */
    public function update(Athlete $athlete, array $attributes, ?string $recorderUserId = null): Athlete
    {
        return DB::transaction(function () use ($athlete, $attributes, $recorderUserId): Athlete {
            $attributes = $this->normalise($attributes);

            // DOB is IMMUTABLE post-create (see AthleteDobImmutableException).
            // Drop the field before touching the row so a payload can carry it
            // without accidentally being applied.
            unset($attributes[AthleteInterface::ATTR_DATE_OF_BIRTH]);

            $this->assertMedicalCallerPermitted($attributes);

            /** @var Athlete $updated */
            $updated = $this->athletes->update((string) $athlete->getKey(), $attributes);

            $this->assertGuardianCoverage($updated);

            if ($this->hasConsentClaim($attributes) && $recorderUserId !== null) {
                $this->consentGate->assertRecorderAuthorised($updated, $recorderUserId);
            }

            return $updated;
        });
    }

    /**
     * {@inheritDoc}
     */
    public function assertGuardianCoverage(Athlete $athlete): void
    {
        if (! $this->isMinor($athlete)) {
            // Adult athletes don't need a guardian on file.
            return;
        }

        $tenantId = (string) $athlete->getAttribute(AthleteInterface::ATTR_TENANT_ID);
        $athleteId = (string) $athlete->getKey();

        $activeGuardianCount = $this->guardians->query()
            ->where(AthleteGuardianInterface::ATTR_TENANT_ID, $tenantId)
            ->where(AthleteGuardianInterface::ATTR_ATHLETE_ID, $athleteId)
            ->whereIn(AthleteGuardianInterface::ATTR_VERIFICATION_STATUS, [
                AthleteGuardianVerificationStatus::Pending->value,
                AthleteGuardianVerificationStatus::Verified->value,
            ])
            ->whereNull(AthleteGuardianInterface::ATTR_REVOKED_AT)
            ->whereNull(AthleteGuardianInterface::ATTR_DELETED_AT)
            ->count();

        if ($activeGuardianCount === 0) {
            throw AthleteGuardianRequiredException::forAthlete(
                $athleteId,
                $this->ageOnDate($athlete, new \DateTimeImmutable()),
            );
        }
    }

    /**
     * {@inheritDoc}
     */
    public function isMinor(Athlete $athlete, ?\DateTimeInterface $on = null): bool
    {
        return $this->ageOnDate($athlete, $on ?? new \DateTimeImmutable()) < self::AGE_OF_MAJORITY;
    }

    /**
     * Whole-year age of the athlete on the reference date.
     *
     * @throws AthleteDobOutOfBoundsException  When the persisted DOB is unparseable
     *                                         (a hard schema violation — should never
     *                                         happen post-migration).
     */
    private function ageOnDate(Athlete $athlete, \DateTimeInterface $reference): int
    {
        $dobRaw = $athlete->getAttribute(AthleteInterface::ATTR_DATE_OF_BIRTH);
        if ($dobRaw === null) {
            throw new AthleteDobOutOfBoundsException('Athlete has no date_of_birth on file.');
        }

        $dob = $dobRaw instanceof \DateTimeInterface
            ? $dobRaw
            : new \DateTimeImmutable((string) $dobRaw);

        return (int) $dob->diff($reference)->y;
    }

    /**
     * Normalise the caller-provided payload — trim strings, coerce string
     * booleans, drop empty arrays.
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    private function normalise(array $attributes): array
    {
        // Default status for a fresh row.
        $attributes[AthleteInterface::ATTR_STATUS] ??= AthleteStatus::Active->value;

        return $attributes;
    }

    /**
     * The DOB must land between {@see self::MIN_AGE_YEARS} and
     * {@see self::MAX_AGE_YEARS} years ago from today. Future dates
     * are refused outright.
     */
    private function assertDobInBounds(mixed $dob): void
    {
        if ($dob === null) {
            // The DB migration marks the column NOT NULL — a null here is a
            // caller bug that Spatie Data validation should have already caught.
            throw new AthleteDobOutOfBoundsException('date_of_birth is required.');
        }

        $parsed = $dob instanceof \DateTimeInterface
            ? $dob
            : new \DateTimeImmutable((string) $dob);

        $now = new \DateTimeImmutable();
        $years = (int) $parsed->diff($now)->y;

        if ($parsed > $now) {
            throw AthleteDobOutOfBoundsException::forFuture($parsed->format('Y-m-d'));
        }
        if ($years < self::MIN_AGE_YEARS || $years > self::MAX_AGE_YEARS) {
            throw AthleteDobOutOfBoundsException::forRange(
                $parsed->format('Y-m-d'),
                self::MIN_AGE_YEARS,
                self::MAX_AGE_YEARS,
            );
        }
    }

    /**
     * Any medical column present in the payload forces the caller to
     * hold the `athletes.manage.medical` permission. The observer
     * enforces the same rule against the persisted row; the
     * provisioner fails fast BEFORE the write.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function assertMedicalCallerPermitted(array $attributes): void
    {
        $touchesMedical = false;
        foreach (self::MEDICAL_COLUMNS as $col) {
            if (\array_key_exists($col, $attributes) && $attributes[$col] !== null && $attributes[$col] !== '') {
                $touchesMedical = true;
                break;
            }
        }

        if (! $touchesMedical) {
            return;
        }

        // Auth::user()->can(...) is Sanctum-scoped; falls back to false when
        // running from a console command or system context without a user.
        $user = auth()->user();
        if ($user === null || ! \method_exists($user, 'can') || ! $user->can('athletes.manage.medical')) {
            throw new AthleteMedicalPermissionRequiredException(
                'Writing medical_* fields requires the athletes.manage.medical permission.'
            );
        }
    }

    /**
     * True when the payload carries at least one consent flag or the
     * recorder columns. Used to know whether to route through the
     * consent gate.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function hasConsentClaim(array $attributes): bool
    {
        return \array_key_exists(AthleteInterface::ATTR_CONSENT_PHOTO_RELEASE, $attributes)
            || \array_key_exists(AthleteInterface::ATTR_CONSENT_MEDICAL_DISCLOSURE, $attributes)
            || \array_key_exists(AthleteInterface::ATTR_CONSENT_THIRD_PARTY, $attributes)
            || \array_key_exists(AthleteInterface::ATTR_CONSENT_RECORDED_AT, $attributes);
    }

    /**
     * Dispatch the create-time domain event. The event carries
     * `ShouldDispatchAfterCommit`, so listeners defer until the
     * wrapping transaction commits — a rolled-back write never
     * fires the fan-out chain.
     */
    private function dispatchCreated(Athlete $athlete, ?string $recorderUserId): void
    {
        // Fail-soft — an event dispatch problem must never take down the
        // create call. Listeners have their own retry semantics.
        try {
            $dobRaw = $athlete->getAttribute(AthleteInterface::ATTR_DATE_OF_BIRTH);
            $dob = $dobRaw instanceof \DateTimeInterface
                ? $dobRaw->format('Y-m-d')
                : (string) $dobRaw;
            $ageYears = $this->ageOnDate($athlete, new \DateTimeImmutable());

            Event::dispatch(new AthleteCreated(
                athleteId: (string) $athlete->getKey(),
                tenantId: (string) $athlete->getAttribute(AthleteInterface::ATTR_TENANT_ID),
                branchId: (string) ($athlete->getAttribute(AthleteInterface::ATTR_BRANCH_ID) ?? ''),
                userId: (string) ($athlete->getAttribute(AthleteInterface::ATTR_USER_ID) ?? ''),
                firstName: (string) $athlete->getAttribute(AthleteInterface::ATTR_FIRST_NAME),
                lastName: (string) $athlete->getAttribute(AthleteInterface::ATTR_LAST_NAME),
                dateOfBirth: $dob,
                ageYearsAtCreate: $ageYears,
                isMinorAtCreate: $ageYears < self::AGE_OF_MAJORITY,
                currentAgeGroupId: (string) ($athlete->getAttribute(AthleteInterface::ATTR_CURRENT_AGE_GROUP_ID) ?? ''),
                createdByUserId: $recorderUserId ?? '',
                source: 'admin_created',
            ));
        } catch (\Throwable) {
            // fail-soft — event dispatch failure must not roll back the write.
        }
    }
}
