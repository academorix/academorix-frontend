<?php

declare(strict_types=1);

namespace Academorix\Compliance\Repositories;

use Academorix\Compliance\Contracts\Data\DsarArtefactInterface;
use Academorix\Compliance\Contracts\Repositories\DsarArtefactRepositoryInterface;
use Academorix\Compliance\Models\DsarArtefact;
use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
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
