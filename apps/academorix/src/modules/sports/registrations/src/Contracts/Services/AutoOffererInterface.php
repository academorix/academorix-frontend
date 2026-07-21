<?php

declare(strict_types=1);

namespace Stackra\Registrations\Contracts\Services;

use Stackra\Registrations\Models\Offer;
use Stackra\Registrations\Services\AutoOfferer;
use Illuminate\Container\Attributes\Bind;

/**
 * Fires an offer to the next waitlist entry when a seat frees up.
 *
 * Triggered by:
 *  - The `Enrolled` state transition of a competing registration
 *    (an accepted offer that consumed a slot),
 *  - Manual capacity increase (`season.capacity` bumped on the fly),
 *  - Enrolled-registration cancellation (an existing enrolment
 *    yields a slot back).
 *
 * Behaviour:
 *  - Uses {@see CapacityResolverInterface::statusFor} to compute
 *    free slots — bails out immediately when zero.
 *  - Reads the monotonic-position-ordered waitlist for the
 *    `(tenant, season, team)` tuple. The head of the waitlist is
 *    the offer recipient.
 *  - Creates a `pending` Offer with a config-driven TTL (default
 *    72h) and fires `OfferMade`.
 *  - Idempotent: if the head of the waitlist already has a
 *    live outstanding offer, we skip. The `OfferExpired` job
 *    removes stale offers so the next call can proceed.
 *
 * Concrete: {@see AutoOfferer}.
 *
 * @category Registrations
 *
 * @since    0.1.0
 */
#[Bind(AutoOfferer::class)]
interface AutoOffererInterface
{
    /**
     * Try to make an offer for a (season, team) tuple.
     *
     * @param  string       $tenantId  Owning tenant.
     * @param  string       $seasonId  Bound Season id.
     * @param  string|null  $teamId    Bound Team id — null for season-wide waitlist.
     *
     * @return Offer|null  The created Offer, or null when no offer was made
     *   (no free capacity, empty waitlist, or head already has a live offer).
     */
    public function tryOfferNext(string $tenantId, string $seasonId, ?string $teamId = null): ?Offer;
}
