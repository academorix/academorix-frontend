<?php

declare(strict_types=1);

namespace Academorix\Activity\Repositories;

use Academorix\Activity\Contracts\Data\ActivityInterface;
use Academorix\Activity\Contracts\Repositories\ActivityRepositoryInterface;
use Academorix\Activity\Models\Activity;
use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use DateTimeInterface;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see ActivityRepositoryInterface}.
 *
 * ## What this class owns
 *
 * The tenant-scoped hot-path finders the feed UI relies on:
 *
 *   - {@see findByTenant()}  — feed pagination.
 *   - {@see findByCauser()}  — "activities I performed" view.
 *   - {@see findByLogName()} — filter facet by domain.
 *   - {@see pruneOlderThan()} — the retention pruner.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 60)]` — short TTL because the feed's most
 * valuable trait is freshness. A 60-second window catches the
 * common polling cadence without touching the DB every time.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(ActivityInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    ActivityInterface::ATTR_TENANT_ID    => ['$eq', '$in'],
    ActivityInterface::ATTR_LOG_NAME     => ['$eq', '$in'],
    ActivityInterface::ATTR_SUBJECT_TYPE => ['$eq', '$in'],
    ActivityInterface::ATTR_SUBJECT_ID   => ['$eq'],
    ActivityInterface::ATTR_CAUSER_TYPE  => ['$eq'],
    ActivityInterface::ATTR_CAUSER_ID    => ['$eq'],
    ActivityInterface::ATTR_EVENT        => ['$eq', '$in'],
    ActivityInterface::ATTR_BATCH_UUID   => ['$eq'],
    ActivityInterface::ATTR_CREATED_AT   => ['$gte', '$lte', '$between'],
])]
final class EloquentActivityRepository extends Repository implements ActivityRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByTenant(string $tenantId, int $limit = 100): Collection
    {
        /** @var Collection<int, Activity> $rows */
        $rows = $this->query()
            ->where(ActivityInterface::ATTR_TENANT_ID, $tenantId)
            ->orderByDesc(ActivityInterface::ATTR_CREATED_AT)
            ->limit($limit)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByCauser(string $causerType, string $causerId): Collection
    {
        /** @var Collection<int, Activity> $rows */
        $rows = $this->query()
            ->where(ActivityInterface::ATTR_CAUSER_TYPE, $causerType)
            ->where(ActivityInterface::ATTR_CAUSER_ID, $causerId)
            ->orderByDesc(ActivityInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByLogName(string $logName): Collection
    {
        /** @var Collection<int, Activity> $rows */
        $rows = $this->query()
            ->where(ActivityInterface::ATTR_LOG_NAME, $logName)
            ->orderByDesc(ActivityInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function pruneOlderThan(DateTimeInterface $cutoff): int
    {
        // Hard-delete — activity rows past retention are UX debris,
        // not compliance evidence. spatie's own model does not
        // compose `SoftDeletes` and neither does ours.
        return $this->query()
            ->where(ActivityInterface::ATTR_CREATED_AT, '<', $cutoff)
            ->delete();
    }
}
