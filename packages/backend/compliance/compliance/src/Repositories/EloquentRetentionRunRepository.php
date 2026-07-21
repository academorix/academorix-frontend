<?php

declare(strict_types=1);

namespace Stackra\Compliance\Repositories;

use Stackra\Compliance\Contracts\Data\RetentionRunInterface;
use Stackra\Compliance\Contracts\Repositories\RetentionRunRepositoryInterface;
use Stackra\Compliance\Models\RetentionRun;
use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of
 * {@see RetentionRunRepositoryInterface}.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(RetentionRunInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    RetentionRunInterface::ATTR_TENANT_ID => ['$eq', '$in'],
    RetentionRunInterface::ATTR_STATUS    => ['$eq', '$in'],
    RetentionRunInterface::ATTR_TRIGGER   => ['$eq', '$in'],
])]
final class EloquentRetentionRunRepository extends Repository implements RetentionRunRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByTenant(string $tenantId, int $limit = 100): Collection
    {
        /** @var Collection<int, RetentionRun> $rows */
        $rows = $this->query()
            ->where(RetentionRunInterface::ATTR_TENANT_ID, $tenantId)
            ->orderByDesc(RetentionRunInterface::ATTR_STARTED_AT)
            ->limit($limit)
            ->get();

        return $rows;
    }
}
