<?php

declare(strict_types=1);

namespace Stackra\Transfer\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Transfer\Contracts\Data\XferArtifactInterface;
use Stackra\Transfer\Contracts\Repositories\XferArtifactRepositoryInterface;
use Stackra\Transfer\Models\XferArtifact;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see XferArtifactRepositoryInterface}.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(XferArtifactInterface::class)]
#[Filterable([
    XferArtifactInterface::ATTR_TENANT_ID   => ['$eq'],
    XferArtifactInterface::ATTR_XFER_JOB_ID => ['$eq'],
    XferArtifactInterface::ATTR_KIND        => ['$eq', '$in'],
])]
final class EloquentXferArtifactRepository extends Repository implements XferArtifactRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByJob(string $xferJobId): Collection
    {
        /** @var Collection<int, XferArtifact> $rows */
        $rows = $this->query()
            ->where(XferArtifactInterface::ATTR_XFER_JOB_ID, $xferJobId)
            ->orderBy(XferArtifactInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findExpired(\DateTimeInterface $cutoff, int $limit = 1000): Collection
    {
        /** @var Collection<int, XferArtifact> $rows */
        $rows = $this->query()
            ->whereNull(XferArtifactInterface::ATTR_PURGED_AT)
            ->whereNotNull(XferArtifactInterface::ATTR_PATH)
            ->where(XferArtifactInterface::ATTR_RETENTION_EXPIRES_AT, '<', $cutoff)
            ->orderBy(XferArtifactInterface::ATTR_RETENTION_EXPIRES_AT)
            ->limit($limit)
            ->get();

        return $rows;
    }
}
