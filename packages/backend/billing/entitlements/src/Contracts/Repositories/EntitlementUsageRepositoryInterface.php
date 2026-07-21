<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Entitlements\Models\EntitlementUsage;
use Stackra\Entitlements\Repositories\EloquentEntitlementUsageRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see EntitlementUsage}.
 *
 * Append-only aggregate — no update path. `sumForPeriod()` is the
 * hot-path aggregation the resolver + admin surfaces consume;
 * `pruneOlderThan()` is what the retention job calls.
 *
 * @extends RepositoryInterface<EntitlementUsage>
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Bind(EloquentEntitlementUsageRepository::class)]
interface EntitlementUsageRepositoryInterface extends RepositoryInterface
{
    /**
     * Every usage row for one entitlement, newest first.
     *
     * @param  string  $entitlementId  Parent entitlement primary key.
     * @return Collection<int, EntitlementUsage>
     */
    public function findByEntitlement(string $entitlementId): Collection;

    /**
     * Sum the `delta` column across every row for one entitlement
     * within one period key (e.g. `2026-07`). Used by the reconcile
     * job to compare against the Redis counter.
     *
     * @param  string  $entitlementId  Parent entitlement primary key.
     * @param  string  $periodKey      Period identifier (e.g. `2026-07`).
     * @return int  Sum of deltas for the period.
     */
    public function sumForPeriod(string $entitlementId, string $periodKey): int;

    /**
     * Delete every row older than `$cutoff`. Returns the number of
     * rows removed. Called by `PruneUsageJob`.
     *
     * @return int  Number of rows deleted.
     */
    public function pruneOlderThan(\DateTimeInterface $cutoff): int;
}
