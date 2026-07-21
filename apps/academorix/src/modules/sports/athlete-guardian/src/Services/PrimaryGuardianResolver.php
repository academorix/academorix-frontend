<?php

declare(strict_types=1);

namespace Stackra\AthleteGuardian\Services;

use Stackra\AthleteGuardian\Contracts\Data\AthleteGuardianInterface;
use Stackra\AthleteGuardian\Contracts\Repositories\AthleteGuardianRepositoryInterface;
use Stackra\AthleteGuardian\Contracts\Services\PrimaryGuardianResolverInterface;
use Stackra\AthleteGuardian\Enums\AthleteGuardianVerificationStatus;
use Stackra\AthleteGuardian\Models\AthleteGuardian;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Support\Facades\DB;

/**
 * Deterministic primary-guardian resolver.
 *
 * ## Tie-breaker (used by `nextPrimaryFor`)
 *
 * When multiple candidate rows exist, order by:
 *
 * ```
 *   verification_status = 'verified'  DESC (verified beats pending)
 *   has_legal_custody = true          DESC
 *   created_at                        ASC  (older beats newer)
 *   id                                ASC  (stable ULID fallback)
 * ```
 *
 * The invariant "exactly one row with `is_primary = true` per athlete
 * at any time" is enforced at the DB level via a partial unique index
 * — see the migration.
 *
 * `#[Scoped]` — reads tenant scope through the repository.
 *
 * @category AthleteGuardian
 *
 * @since    0.1.0
 */
#[Scoped]
final class PrimaryGuardianResolver implements PrimaryGuardianResolverInterface
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
    public function primaryFor(string $tenantId, string $athleteId): ?AthleteGuardian
    {
        /** @var AthleteGuardian|null $row */
        $row = $this->activeQuery($tenantId, $athleteId)
            ->where(AthleteGuardianInterface::ATTR_IS_PRIMARY, true)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function nextPrimaryFor(string $tenantId, string $athleteId): ?AthleteGuardian
    {
        /** @var AthleteGuardian|null $row */
        $row = $this->activeQuery($tenantId, $athleteId)
            ->where(AthleteGuardianInterface::ATTR_IS_PRIMARY, false)
            ->orderByRaw(\sprintf(
                "CASE WHEN %s = ? THEN 0 ELSE 1 END ASC",
                AthleteGuardianInterface::ATTR_VERIFICATION_STATUS,
            ), [AthleteGuardianVerificationStatus::Verified->value])
            ->orderBy(AthleteGuardianInterface::ATTR_HAS_LEGAL_CUSTODY, 'desc')
            ->orderBy(AthleteGuardianInterface::ATTR_CREATED_AT)
            ->orderBy(AthleteGuardianInterface::ATTR_ID)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function reassignPrimary(AthleteGuardian $target): AthleteGuardian
    {
        $tenantId = (string) $target->getAttribute(AthleteGuardianInterface::ATTR_TENANT_ID);
        $athleteId = (string) $target->getAttribute(AthleteGuardianInterface::ATTR_ATHLETE_ID);
        $targetId = (string) $target->getKey();

        return DB::transaction(function () use ($tenantId, $athleteId, $targetId, $target): AthleteGuardian {
            // Clear the CURRENT primary (if any). We intentionally use a raw
            // query over the repository to avoid the model observer firing —
            // this is a bulk flip, not a semantic update.
            DB::table(AthleteGuardianInterface::TABLE)
                ->where(AthleteGuardianInterface::ATTR_TENANT_ID, $tenantId)
                ->where(AthleteGuardianInterface::ATTR_ATHLETE_ID, $athleteId)
                ->where(AthleteGuardianInterface::ATTR_IS_PRIMARY, true)
                ->whereNull(AthleteGuardianInterface::ATTR_REVOKED_AT)
                ->whereNull(AthleteGuardianInterface::ATTR_DELETED_AT)
                ->update([
                    AthleteGuardianInterface::ATTR_IS_PRIMARY => false,
                    AthleteGuardianInterface::ATTR_UPDATED_AT => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
                ]);

            // Flip the target row's primary flag.
            /** @var AthleteGuardian $updated */
            $updated = $this->guardians->update($targetId, [
                AthleteGuardianInterface::ATTR_IS_PRIMARY => true,
            ]);

            return $updated;
        });
    }

    /**
     * Base query — the pool of non-revoked, non-deleted rows for a
     * given (tenant, athlete). Applied to every read the resolver
     * makes.
     */
    private function activeQuery(string $tenantId, string $athleteId): \Illuminate\Contracts\Database\Query\Builder
    {
        return $this->guardians->query()
            ->where(AthleteGuardianInterface::ATTR_TENANT_ID, $tenantId)
            ->where(AthleteGuardianInterface::ATTR_ATHLETE_ID, $athleteId)
            ->whereNotIn(AthleteGuardianInterface::ATTR_VERIFICATION_STATUS, [
                AthleteGuardianVerificationStatus::Revoked->value,
                AthleteGuardianVerificationStatus::Disputed->value,
            ])
            ->whereNull(AthleteGuardianInterface::ATTR_REVOKED_AT)
            ->whereNull(AthleteGuardianInterface::ATTR_DELETED_AT);
    }
}
