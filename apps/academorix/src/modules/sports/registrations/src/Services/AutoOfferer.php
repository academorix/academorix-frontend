<?php

declare(strict_types=1);

namespace Stackra\Registrations\Services;

use Stackra\Registrations\Contracts\Data\OfferInterface;
use Stackra\Registrations\Contracts\Data\WaitlistEntryInterface;
use Stackra\Registrations\Contracts\Repositories\OfferRepositoryInterface;
use Stackra\Registrations\Contracts\Repositories\RegistrationRepositoryInterface;
use Stackra\Registrations\Contracts\Repositories\WaitlistRepositoryInterface;
use Stackra\Registrations\Contracts\Services\AutoOffererInterface;
use Stackra\Registrations\Contracts\Services\CapacityResolverInterface;
use Stackra\Registrations\Enums\OfferStatus;
use Stackra\Registrations\Events\OfferMade;
use Stackra\Registrations\Models\Offer;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\DB;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Contracts\Events\Dispatcher as EventDispatcher;
use Illuminate\Database\ConnectionInterface;
use Psr\Log\LoggerInterface;

/**
 * Reference implementation of
 * {@see \Stackra\Registrations\Contracts\Services\AutoOffererInterface}.
 *
 * Algorithm:
 *  1. Delegate to {@see CapacityResolverInterface::statusFor} to
 *     compute the free-slot count for the tuple. Bail with `null`
 *     when the count is zero.
 *  2. Read the head of the waitlist for the tuple — the row with
 *     the lowest `position` and no live outstanding offer.
 *  3. Create a `pending` Offer with `expires_at = now + offer_ttl`
 *     (config knob, default 72h). Fire `OfferMade`. Bump the
 *     waitlist entry's `offered_at`.
 *
 * The whole path runs in a single transaction so two concurrent
 * capacity-free events cannot double-offer the same seat.
 *
 * `#[Scoped]` — reads active tenant scope through injected repos.
 *
 * @category Registrations
 *
 * @since    0.1.0
 */
#[Scoped]
final class AutoOfferer implements AutoOffererInterface
{
    /**
     * Default offer TTL — 72 hours from creation. Long enough to
     * survive a weekend, short enough that a lapsing offer
     * refreshes the funnel weekly.
     */
    private const int DEFAULT_OFFER_TTL_HOURS = 72;

    public function __construct(
        private readonly CapacityResolverInterface $capacity,
        private readonly WaitlistRepositoryInterface $waitlist,
        private readonly OfferRepositoryInterface $offers,
        private readonly RegistrationRepositoryInterface $registrations,
        private readonly EventDispatcher $events,
        #[DB] private readonly ConnectionInterface $db,
        #[Log('registrations')] private readonly LoggerInterface $log,
        #[Config('registrations.offer_ttl_hours', self::DEFAULT_OFFER_TTL_HOURS)]
        private readonly int $offerTtlHours,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function tryOfferNext(string $tenantId, string $seasonId, ?string $teamId = null): ?Offer
    {
        return $this->db->transaction(function () use ($tenantId, $seasonId, $teamId): ?Offer {
            // 1. Capacity check.
            $status = $this->capacity->statusFor($tenantId, $seasonId, $teamId);
            if (! $status->hasFreeSlots) {
                return null;
            }

            // 2. Head of the waitlist — lowest `position` that
            //    hasn't received a live offer.
            $head = $this->readWaitlistHead($tenantId, $seasonId, $teamId);
            if ($head === null) {
                return null;
            }

            // 3. Skip when the head already has a live offer.
            if ($this->hasLiveOffer((string) $head->getAttribute(WaitlistEntryInterface::ATTR_REGISTRATION_ID))) {
                $this->log->info('auto-offerer: head of waitlist already has a live offer; skipping', [
                    'registration_id' => $head->getAttribute(WaitlistEntryInterface::ATTR_REGISTRATION_ID),
                    'season_id'       => $seasonId,
                    'team_id'         => $teamId,
                ]);

                return null;
            }

            // 4. Create the offer.
            $now = new \DateTimeImmutable();
            $expiresAt = $now->modify("+{$this->offerTtlHours} hours");

            /** @var Offer $offer */
            $offer = $this->offers->create([
                OfferInterface::ATTR_TENANT_ID       => $tenantId,
                OfferInterface::ATTR_REGISTRATION_ID => $head->getAttribute(WaitlistEntryInterface::ATTR_REGISTRATION_ID),
                OfferInterface::ATTR_SEASON_ID       => $seasonId,
                OfferInterface::ATTR_TEAM_ID         => $teamId,
                OfferInterface::ATTR_STATUS          => OfferStatus::Pending->value,
                OfferInterface::ATTR_EXPIRES_AT      => $expiresAt,
                OfferInterface::ATTR_OFFERED_AT      => $now,
            ]);

            // 5. Bump the waitlist entry's `offered_at` so the next
            //    call skips this row until the offer resolves.
            $this->waitlist->update((string) $head->getKey(), [
                WaitlistEntryInterface::ATTR_OFFERED_AT => $now,
            ]);

            // 6. Fire the domain event. `OfferMade` implements
            //    `ShouldDispatchAfterCommit` so no listener runs
            //    until the transaction commits.
            $this->events->dispatch(new OfferMade($offer));

            return $offer;
        });
    }

    /**
     * Read the head of the waitlist — lowest `position`, not
     * already offered.
     */
    private function readWaitlistHead(string $tenantId, string $seasonId, ?string $teamId): ?\Illuminate\Database\Eloquent\Model
    {
        $query = $this->waitlist
            ->getModel()
            ->newQuery()
            ->where(WaitlistEntryInterface::ATTR_TENANT_ID, $tenantId)
            ->where(WaitlistEntryInterface::ATTR_SEASON_ID, $seasonId)
            ->whereNull(WaitlistEntryInterface::ATTR_REMOVED_AT)
            ->orderBy(WaitlistEntryInterface::ATTR_POSITION, 'asc');

        if ($teamId !== null) {
            $query->where(WaitlistEntryInterface::ATTR_TEAM_ID, $teamId);
        } else {
            $query->whereNull(WaitlistEntryInterface::ATTR_TEAM_ID);
        }

        // Row-level lock so a concurrent AutoOfferer.tryOfferNext()
        // call on the same tuple cannot pick the same head.
        return $query->lockForUpdate()->first();
    }

    /**
     * Check whether a registration already has a live outstanding
     * offer. Prevents double-offer on retry / concurrent invocation.
     */
    private function hasLiveOffer(string $registrationId): bool
    {
        return $this->offers
            ->getModel()
            ->newQuery()
            ->where(OfferInterface::ATTR_REGISTRATION_ID, $registrationId)
            ->where(OfferInterface::ATTR_STATUS, OfferStatus::Pending->value)
            ->exists();
    }
}
