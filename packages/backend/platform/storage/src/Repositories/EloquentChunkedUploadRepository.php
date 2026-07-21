<?php

declare(strict_types=1);

namespace Stackra\Storage\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Storage\Contracts\Data\ChunkedUploadInterface;
use Stackra\Storage\Contracts\Repositories\ChunkedUploadRepositoryInterface;
use Stackra\Storage\Enums\ChunkedUploadState;
use Stackra\Storage\Models\ChunkedUpload;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see ChunkedUploadRepositoryInterface}.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(ChunkedUploadInterface::class)]
#[Cacheable(ttl: 30, tags: true)]
#[Filterable([
    ChunkedUploadInterface::ATTR_TENANT_ID   => ['$eq', '$in'],
    ChunkedUploadInterface::ATTR_OWNER_ID    => ['$eq', '$in'],
    ChunkedUploadInterface::ATTR_STATE       => ['$eq', '$in'],
    ChunkedUploadInterface::ATTR_TARGET_KIND => ['$eq', '$in'],
    ChunkedUploadInterface::ATTR_PROTOCOL    => ['$eq'],
])]
final class EloquentChunkedUploadRepository extends Repository implements ChunkedUploadRepositoryInterface
{
    /**
     * {@inheritDoc}
     *
     * Cross-tenant scan — the retention job runs against every tenant.
     */
    public function findExpired(\DateTimeInterface $now): Collection
    {
        /** @var Collection<int, ChunkedUpload> $rows */
        $rows = $this->query()
            ->withoutGlobalScopes()
            ->whereIn(ChunkedUploadInterface::ATTR_STATE, [
                ChunkedUploadState::Initiating->value,
                ChunkedUploadState::Uploading->value,
                ChunkedUploadState::Finalizing->value,
            ])
            ->where(ChunkedUploadInterface::ATTR_EXPIRES_AT, '<=', $now)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findInflight(string $tenantId): Collection
    {
        /** @var Collection<int, ChunkedUpload> $rows */
        $rows = $this->query()
            ->where(ChunkedUploadInterface::ATTR_TENANT_ID, $tenantId)
            ->whereIn(ChunkedUploadInterface::ATTR_STATE, [
                ChunkedUploadState::Initiating->value,
                ChunkedUploadState::Uploading->value,
                ChunkedUploadState::Finalizing->value,
            ])
            ->orderByDesc(ChunkedUploadInterface::ATTR_INITIATED_AT)
            ->get();

        return $rows;
    }
}
