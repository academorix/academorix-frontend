<?php

declare(strict_types=1);

namespace Stackra\Activity\Contracts\Repositories;

use Stackra\Activity\Models\Activity;
use Stackra\Activity\Repositories\EloquentActivityRepository;
use Stackra\Crud\Contracts\RepositoryInterface;
use DateTimeInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see Activity}.
 *
 * Adds tenant-scoped finders + the retention pruner on top of the
 * base CRUD surface. Consumers type-hint the interface, not the
 * concrete `EloquentActivityRepository`, so the container can swap in
 * a stub for tests.
 *
 * @extends RepositoryInterface<Activity>
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[Bind(EloquentActivityRepository::class)]
interface ActivityRepositoryInterface extends RepositoryInterface
{
    /**
     * Every activity row for a tenant, newest-first.
     *
     * `BelongsToTenant`'s global scope filters automatically when the
     * request runs under a resolved tenant context; the explicit
     * tenant filter here handles the platform-admin cross-tenant
     * path (which bypasses the global scope).
     *
     * @param  string  $tenantId  Tenant to scope by.
     * @param  int     $limit     Row cap; the default matches the
     *                            product feed's initial page size.
     * @return Collection<int, Activity>
     */
    public function findByTenant(string $tenantId, int $limit = 100): Collection;

    /**
     * Every activity row caused by a specific causer (typically a
     * User), newest-first.
     *
     * `causer_type` is the polymorphic class FQCN; `causer_id` is
     * the corresponding key. Callers that already have a `User`
     * instance can pass its class + id directly.
     *
     * @param  string  $causerType  Polymorphic type (e.g. `App\Models\User`).
     * @param  string  $causerId    Polymorphic id.
     * @return Collection<int, Activity>
     */
    public function findByCauser(string $causerType, string $causerId): Collection;

    /**
     * Every activity row grouped under one `log_name`, newest-first.
     *
     * Used by the feed UI's "filter by domain" facet — e.g. show me
     * every `branch` event.
     *
     * @param  string  $logName  Log name to match exactly.
     * @return Collection<int, Activity>
     */
    public function findByLogName(string $logName): Collection;

    /**
     * Hard-delete every row whose `created_at` is strictly before the
     * cutoff. Consumers pass the tier-derived cutoff — this method
     * does not compute retention itself.
     *
     * @param  DateTimeInterface  $cutoff  Rows created before this are pruned.
     * @return int  Number of rows deleted.
     */
    public function pruneOlderThan(DateTimeInterface $cutoff): int;
}
