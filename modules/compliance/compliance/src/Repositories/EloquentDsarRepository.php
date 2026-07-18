<?php

declare(strict_types=1);

namespace Academorix\Compliance\Repositories;

use Academorix\Compliance\Contracts\Data\DsarInterface;
use Academorix\Compliance\Contracts\Repositories\DsarRepositoryInterface;
use Academorix\Compliance\Models\Dsar;
use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see DsarRepositoryInterface}.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(DsarInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    DsarInterface::ATTR_TENANT_ID    => ['$eq', '$in'],
    DsarInterface::ATTR_SUBJECT_TYPE => ['$eq'],
    DsarInterface::ATTR_SUBJECT_ID   => ['$eq'],
    DsarInterface::ATTR_ACTION       => ['$eq', '$in'],
    DsarInterface::ATTR_STATE        => ['$eq', '$in'],
])]
final class EloquentDsarRepository extends Repository implements DsarRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByTenant(string $tenantId, int $limit = 100): Collection
    {
        /** @var Collection<int, Dsar> $rows */
        $rows = $this->query()
            ->where(DsarInterface::ATTR_TENANT_ID, $tenantId)
            ->orderByDesc(DsarInterface::ATTR_REQUESTED_AT)
            ->limit($limit)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findBySubject(string $subjectType, string $subjectId): Collection
    {
        /** @var Collection<int, Dsar> $rows */
        $rows = $this->query()
            ->where(DsarInterface::ATTR_SUBJECT_TYPE, $subjectType)
            ->where(DsarInterface::ATTR_SUBJECT_ID, $subjectId)
            ->orderByDesc(DsarInterface::ATTR_REQUESTED_AT)
            ->get();

        return $rows;
    }
}
