<?php

declare(strict_types=1);

namespace Stackra\Transfer\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Transfer\Contracts\Data\XferJobInterface;
use Stackra\Transfer\Contracts\Repositories\XferJobRepositoryInterface;
use Stackra\Transfer\Enums\XferJobStatus;
use Stackra\Transfer\Models\XferJob;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see XferJobRepositoryInterface}.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(XferJobInterface::class)]
#[Cacheable(ttl: 30, tags: true)]
#[Filterable([
    XferJobInterface::ATTR_TENANT_ID          => ['$eq', '$in'],
    XferJobInterface::ATTR_KIND               => ['$eq', '$in'],
    XferJobInterface::ATTR_ENTITY_KEY         => ['$eq', '$in'],
    XferJobInterface::ATTR_STATUS             => ['$eq', '$in'],
    XferJobInterface::ATTR_INITIATOR_USER_ID  => ['$eq'],
    XferJobInterface::ATTR_CREATED_AT         => ['$gte', '$lte', '$between'],
])]
final class EloquentXferJobRepository extends Repository implements XferJobRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByInitiator(string $initiatorUserId, int $limit = 50): Collection
    {
        /** @var Collection<int, XferJob> $rows */
        $rows = $this->query()
            ->where(XferJobInterface::ATTR_INITIATOR_USER_ID, $initiatorUserId)
            ->orderByDesc(XferJobInterface::ATTR_CREATED_AT)
            ->limit($limit)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findInFlightForTenant(string $tenantId): Collection
    {
        /** @var Collection<int, XferJob> $rows */
        $rows = $this->query()
            ->where(XferJobInterface::ATTR_TENANT_ID, $tenantId)
            ->whereIn(XferJobInterface::ATTR_STATUS, [
                XferJobStatus::Queued->value,
                XferJobStatus::Running->value,
            ])
            ->orderByDesc(XferJobInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findStale(\DateTimeInterface $cutoff): Collection
    {
        /** @var Collection<int, XferJob> $rows */
        $rows = $this->query()
            ->whereIn(XferJobInterface::ATTR_STATUS, [
                XferJobStatus::Queued->value,
                XferJobStatus::Running->value,
            ])
            ->where(XferJobInterface::ATTR_UPDATED_AT, '<', $cutoff)
            ->orderBy(XferJobInterface::ATTR_UPDATED_AT)
            ->get();

        return $rows;
    }
}
