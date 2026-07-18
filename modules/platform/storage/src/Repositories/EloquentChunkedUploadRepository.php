<?php

declare(strict_types=1);

namespace Academorix\Storage\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Storage\Contracts\Data\ChunkedUploadInterface;
use Academorix\Storage\Contracts\Repositories\ChunkedUploadRepositoryInterface;
use Academorix\Storage\Enums\ChunkedUploadState;
use Academorix\Storage\Models\ChunkedUpload;
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
