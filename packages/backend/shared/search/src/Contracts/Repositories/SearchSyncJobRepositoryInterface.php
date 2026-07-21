<?php

declare(strict_types=1);

namespace Stackra\Search\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Search\Models\SearchSyncJob;
use Stackra\Search\Repositories\EloquentSearchSyncJobRepository;
use DateTimeInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see SearchSyncJob}.
 *
 * Adds status- and causer-scoped finders on top of the base CRUD
 * surface plus retention pruning.
 *
 * @extends RepositoryInterface<SearchSyncJob>
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Bind(EloquentSearchSyncJobRepository::class)]
interface SearchSyncJobRepositoryInterface extends RepositoryInterface
{
    /**
     * Find every sync job for a tenant, newest-first.
     *
     * @return Collection<int, SearchSyncJob>
     */
    public function findByTenant(string $tenantId, int $limit = 100): Collection;

    /**
     * Find every sync job initiated by a specific causer.
     *
     * @return Collection<int, SearchSyncJob>
     */
    public function findByCauser(string $causerType, string $causerId): Collection;

    /**
     * Find every sync job for a specific index.
     *
     * @return Collection<int, SearchSyncJob>
     */
    public function findByIndex(string $searchIndexId): Collection;

    /**
     * Find sync jobs matching any of the given status values.
     *
     * @param  list<string>  $statuses
     * @return Collection<int, SearchSyncJob>
     */
    public function findByStatus(array $statuses): Collection;

    /**
     * Hard-delete rows whose `created_at` predates the cutoff.
     */
    public function pruneOlderThan(DateTimeInterface $cutoff): int;
}
