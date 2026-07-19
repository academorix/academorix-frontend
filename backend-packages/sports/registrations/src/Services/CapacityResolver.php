<?php

declare(strict_types=1);

namespace Academorix\Registrations\Services;

use Academorix\Registrations\Contracts\Data\RegistrationInterface;
use Academorix\Registrations\Contracts\Repositories\RegistrationRepositoryInterface;
use Academorix\Registrations\Contracts\Services\CapacityResolverInterface;
use Academorix\Registrations\Data\CapacityStatusData;
use Academorix\Registrations\Enums\RegistrationStage;
use Illuminate\Container\Attributes\DB;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Database\ConnectionInterface;

/**
 * Reference implementation of
 * {@see \Academorix\Registrations\Contracts\Services\CapacityResolverInterface}.
 *
 * Query strategy:
 *  1. Look up `capacity` on either `teams.<team_id>.capacity`
 *     (when `teamId` is present) or `seasons.<season_id>.capacity`.
 *     Both columns live in sibling modules — we read them via raw
 *     table joins to avoid a hard cross-module import.
 *  2. Count `registrations` rows for the same tuple with status in
 *     `{Enrolled, OfferMade}` — those are the consumed slots.
 *  3. `free = capacity - consumed`, clamped to zero.
 *
 * All reads happen inside a single READ COMMITTED transaction to
 * give a consistent snapshot without the cost of SERIALIZABLE — a
 * slight over-count of `free` from a concurrent enrollment is
 * corrected on the next call and is safer than a hot-serial lock.
 *
 * `#[Scoped]` — reads the active tenant scope via injected repo.
 *
 * @category Registrations
 *
 * @since    0.1.0
 */
#[Scoped]
final class CapacityResolver implements CapacityResolverInterface
{
    public function __construct(
        private readonly RegistrationRepositoryInterface $registrations,
        #[DB] private readonly ConnectionInterface $db,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function statusFor(string $tenantId, string $seasonId, ?string $teamId = null): CapacityStatusData
    {
        return $this->db->transaction(function () use ($tenantId, $seasonId, $teamId): CapacityStatusData {
            $capacity = $this->readCapacity($tenantId, $seasonId, $teamId);
            $consumed = $this->readConsumed($tenantId, $seasonId, $teamId);
            $enrolled = $consumed['enrolled'];
            $pendingOffer = $consumed['pending_offer'];
            $free = max(0, $capacity - $enrolled - $pendingOffer);

            return new CapacityStatusData(
                seasonId: $seasonId,
                teamId: $teamId,
                capacity: $capacity,
                enrolled: $enrolled,
                pendingOffer: $pendingOffer,
                free: $free,
                hasFreeSlots: $free > 0,
            );
        });
    }

    /**
     * Read the authoring-time capacity from the team (preferred) or
     * the season. Missing capacity -> 0 (every registration lands
     * on the waitlist).
     */
    private function readCapacity(string $tenantId, string $seasonId, ?string $teamId): int
    {
        if ($teamId !== null) {
            $capacity = $this->db->table('teams')
                ->where('id', $teamId)
                ->where('tenant_id', $tenantId)
                ->value('capacity');
            if ($capacity !== null) {
                return (int) $capacity;
            }
        }
        $seasonCapacity = $this->db->table('seasons')
            ->where('id', $seasonId)
            ->where('tenant_id', $tenantId)
            ->value('capacity');

        return (int) ($seasonCapacity ?? 0);
    }

    /**
     * Count consumed slots — both `Enrolled` and live `OfferMade`.
     * Uses conditional aggregation so both counts land in one
     * round-trip.
     *
     * @return array{enrolled: int, pending_offer: int}
     */
    private function readConsumed(string $tenantId, string $seasonId, ?string $teamId): array
    {
        $query = $this->registrations
            ->getModel()
            ->newQuery()
            ->where(RegistrationInterface::ATTR_TENANT_ID, $tenantId)
            ->where(RegistrationInterface::ATTR_SEASON_ID, $seasonId);

        if ($teamId !== null) {
            $query->where(RegistrationInterface::ATTR_TEAM_ID, $teamId);
        }

        $rows = (clone $query)
            ->selectRaw(sprintf(
                'SUM(CASE WHEN %s = ? THEN 1 ELSE 0 END) AS enrolled_count, '
                . 'SUM(CASE WHEN %s = ? THEN 1 ELSE 0 END) AS pending_offer_count',
                RegistrationInterface::ATTR_STAGE,
                RegistrationInterface::ATTR_STAGE,
            ), [RegistrationStage::Enrolled->value, RegistrationStage::Offered->value])
            ->first();

        return [
            'enrolled'      => (int) ($rows->enrolled_count ?? 0),
            'pending_offer' => (int) ($rows->pending_offer_count ?? 0),
        ];
    }
}
