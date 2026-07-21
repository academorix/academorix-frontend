<?php

declare(strict_types=1);

namespace Stackra\Compliance\Repositories;

use Stackra\Compliance\Contracts\Data\DsarInterface;
use Stackra\Compliance\Contracts\Repositories\DsarRepositoryInterface;
use Stackra\Compliance\Models\Dsar;
use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
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
