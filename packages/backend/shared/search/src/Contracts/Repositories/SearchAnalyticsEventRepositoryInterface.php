<?php

declare(strict_types=1);

namespace Stackra\Search\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Search\Models\SearchAnalyticsEvent;
use Stackra\Search\Repositories\EloquentSearchAnalyticsEventRepository;
use DateTimeInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see SearchAnalyticsEvent}.
 *
 * @extends RepositoryInterface<SearchAnalyticsEvent>
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Bind(EloquentSearchAnalyticsEventRepository::class)]
interface SearchAnalyticsEventRepositoryInterface extends RepositoryInterface
{
    /**
     * Every event for a tenant inside a time window.
     *
     * @return Collection<int, SearchAnalyticsEvent>
     */
    public function findByTenantWindow(
        string $tenantId,
        DateTimeInterface $from,
        DateTimeInterface $to,
        int $limit = 1000,
    ): Collection;

    /**
     * Top queries by count (grouped on `query_hash`), newest window first.
     *
     * @return array<int, array{query_hash: string, count: int}>
     */
    public function topQueries(string $tenantId, DateTimeInterface $from, int $limit = 50): array;

    /**
     * Hard-delete rows past retention. Called by the retention job.
     */
    public function pruneOlderThan(DateTimeInterface $cutoff): int;

    /**
     * Scrub raw `query` text past its retention window. GDPR safety
     * net independent of row pruning.
     */
    public function scrubQueryText(DateTimeInterface $cutoff): int;
}
