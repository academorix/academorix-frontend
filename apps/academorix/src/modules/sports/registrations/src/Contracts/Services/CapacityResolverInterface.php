<?php

declare(strict_types=1);

namespace Stackra\Registrations\Contracts\Services;

use Stackra\Registrations\Data\CapacityStatusData;
use Stackra\Registrations\Services\CapacityResolver;
use Illuminate\Container\Attributes\Bind;

/**
 * Free-capacity computation for a (season, team) tuple.
 *
 * Registration flow branches on capacity: when a candidate submits
 * a registration, the resolver decides whether the caller enters
 * the enrolled path directly OR gets placed on the waitlist. The
 * numerator is `season.capacity` (or `team.capacity` when the
 * season is team-scoped); the denominator is the count of enrolled
 * + pending-offer rows. Pending offers count as consumed because
 * a live offer has locked the slot for its TTL.
 *
 * Concrete: {@see CapacityResolver}.
 *
 * @category Registrations
 *
 * @since    0.1.0
 */
#[Bind(CapacityResolver::class)]
interface CapacityResolverInterface
{
    /**
     * Return the capacity status for a (season, team) tuple.
     *
     * @param  string       $tenantId  Owning tenant.
     * @param  string       $seasonId  Bound Season id.
     * @param  string|null  $teamId    Bound Team id — null for season-wide capacity.
     */
    public function statusFor(string $tenantId, string $seasonId, ?string $teamId = null): CapacityStatusData;
}
