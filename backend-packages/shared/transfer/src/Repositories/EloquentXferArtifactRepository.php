<?php

declare(strict_types=1);

namespace Academorix\Transfer\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Transfer\Contracts\Data\XferArtifactInterface;
use Academorix\Transfer\Contracts\Repositories\XferArtifactRepositoryInterface;
use Academorix\Transfer\Models\XferArtifact;
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
