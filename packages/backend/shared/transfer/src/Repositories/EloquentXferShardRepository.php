<?php

declare(strict_types=1);

namespace Stackra\Transfer\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Transfer\Contracts\Data\XferShardInterface;
use Stackra\Transfer\Contracts\Repositories\XferShardRepositoryInterface;
use Stackra\Transfer\Enums\XferShardStatus;
use Stackra\Transfer\Models\XferShard;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see XferShardRepositoryInterface}.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(XferShardInterface::class)]
#[Filterable([
    XferShardInterface::ATTR_TENANT_ID   => ['$eq'],
    XferShardInterface::ATTR_XFER_JOB_ID => ['$eq'],
    XferShardInterface::ATTR_STATUS      => ['$eq', '$in'],
])]
final class EloquentXferShardRepository extends Repository implements XferShardRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByJob(string $xferJobId): Collection
    {
        /** @var Collection<int, XferShard> $rows */
        $rows = $this->query()
            ->where(XferShardInterface::ATTR_XFER_JOB_ID, $xferJobId)
            ->orderBy(XferShardInterface::ATTR_INDEX)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findFailedForJob(string $xferJobId): Collection
    {
        /** @var Collection<int, XferShard> $rows */
        $rows = $this->query()
            ->where(XferShardInterface::ATTR_XFER_JOB_ID, $xferJobId)
            ->where(XferShardInterface::ATTR_STATUS, XferShardStatus::Failed->value)
            ->orderBy(XferShardInterface::ATTR_INDEX)
            ->get();

        return $rows;
    }
}
