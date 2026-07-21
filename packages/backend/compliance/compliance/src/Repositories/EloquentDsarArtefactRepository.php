<?php

declare(strict_types=1);

namespace Stackra\Compliance\Repositories;

use Stackra\Compliance\Contracts\Data\DsarArtefactInterface;
use Stackra\Compliance\Contracts\Repositories\DsarArtefactRepositoryInterface;
use Stackra\Compliance\Models\DsarArtefact;
use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of
 * {@see DsarArtefactRepositoryInterface}.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(DsarArtefactInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    DsarArtefactInterface::ATTR_DSAR_ID => ['$eq', '$in'],
    DsarArtefactInterface::ATTR_MODULE  => ['$eq', '$in'],
    DsarArtefactInterface::ATTR_STATUS  => ['$eq', '$in'],
])]
final class EloquentDsarArtefactRepository extends Repository implements DsarArtefactRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByDsar(string $dsarId): Collection
    {
        /** @var Collection<int, DsarArtefact> $rows */
        $rows = $this->query()
            ->where(DsarArtefactInterface::ATTR_DSAR_ID, $dsarId)
            ->orderBy(DsarArtefactInterface::ATTR_MODULE)
            ->get();

        return $rows;
    }
}
