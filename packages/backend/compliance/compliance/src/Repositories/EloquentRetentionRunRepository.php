<?php

declare(strict_types=1);

namespace Academorix\Compliance\Repositories;

use Academorix\Compliance\Contracts\Data\RetentionRunInterface;
use Academorix\Compliance\Contracts\Repositories\RetentionRunRepositoryInterface;
use Academorix\Compliance\Models\RetentionRun;
use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
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
