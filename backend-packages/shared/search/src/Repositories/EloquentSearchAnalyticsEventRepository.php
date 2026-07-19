<?php

declare(strict_types=1);

namespace Academorix\Search\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Search\Contracts\Data\SearchAnalyticsEventInterface;
use Academorix\Search\Contracts\Repositories\SearchAnalyticsEventRepositoryInterface;
use Academorix\Search\Models\SearchAnalyticsEvent;
use DateTimeInterface;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see SearchAnalyticsEventRepositoryInterface}.
 *
 * No caching — every query hits the DB. Analytics is telemetry, not
 * a hot read path; the aggregation queries live behind the analytics
 * facade with their own cache.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(SearchAnalyticsEventInterface::class)]
#[Filterable([
    SearchAnalyticsEventInterface::ATTR_TENANT_ID  => ['$eq', '$in'],
    SearchAnalyticsEventInterface::ATTR_USER_ID    => ['$eq'],
    SearchAnalyticsEventInterface::ATTR_KIND       => ['$eq', '$in'],
    SearchAnalyticsEventInterface::ATTR_ENGINE     => ['$eq', '$in'],
    SearchAnalyticsEventInterface::ATTR_QUERY_HASH => ['$eq'],
    SearchAnalyticsEventInterface::ATTR_CREATED_AT => ['$gte', '$lte', '$between'],
])]
final class EloquentSearchAnalyticsEventRepository extends Repository implements SearchAnalyticsEventRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByTenantWindow(
        string $tenantId,
        DateTimeInterface $from,
        DateTimeInterface $to,
        int $limit = 1000,
    ): Collection {
        /** @var Collection<int, SearchAnalyticsEvent> $rows */
        $rows = $this->query()
            ->where(SearchAnalyticsEventInterface::ATTR_TENANT_ID, $tenantId)
            ->whereBetween(SearchAnalyticsEventInterface::ATTR_CREATED_AT, [$from, $to])
            ->orderByDesc(SearchAnalyticsEventInterface::ATTR_CREATED_AT)
            ->limit($limit)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function topQueries(string $tenantId, DateTimeInterface $from, int $limit = 50): array
    {
        /** @var array<int, array{query_hash: string, count: int}> $rows */
        $rows = $this->query()
            ->where(SearchAnalyticsEventInterface::ATTR_TENANT_ID, $tenantId)
            ->where(SearchAnalyticsEventInterface::ATTR_CREATED_AT, '>=', $from)
            ->whereNotNull(SearchAnalyticsEventInterface::ATTR_QUERY_HASH)
            ->selectRaw(
                SearchAnalyticsEventInterface::ATTR_QUERY_HASH . ' as query_hash, COUNT(*) as count',
            )
            ->groupBy(SearchAnalyticsEventInterface::ATTR_QUERY_HASH)
            ->orderByDesc('count')
            ->limit($limit)
            ->get()
            ->map(static fn ($row): array => [
                'query_hash' => (string) $row->query_hash,
                'count'      => (int) $row->count,
            ])
            ->all();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function pruneOlderThan(DateTimeInterface $cutoff): int
    {
        return $this->query()
            ->where(SearchAnalyticsEventInterface::ATTR_CREATED_AT, '<', $cutoff)
            ->delete();
    }

    /**
     * {@inheritDoc}
     */
    public function scrubQueryText(DateTimeInterface $cutoff): int
    {
        return $this->query()
            ->where(SearchAnalyticsEventInterface::ATTR_CREATED_AT, '<', $cutoff)
            ->whereNotNull(SearchAnalyticsEventInterface::ATTR_QUERY)
            ->update([SearchAnalyticsEventInterface::ATTR_QUERY => null]);
    }
}
