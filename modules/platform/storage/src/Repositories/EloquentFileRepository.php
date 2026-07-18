<?php

declare(strict_types=1);

namespace Academorix\Storage\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Storage\Contracts\Data\FileInterface;
use Academorix\Storage\Contracts\Repositories\FileRepositoryInterface;
use Academorix\Storage\Enums\VirusScanState;
use Academorix\Storage\Models\File;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see FileRepositoryInterface}.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(FileInterface::class)]
#[Cacheable(ttl: 300, tags: true)]
#[Filterable([
    FileInterface::ATTR_TENANT_ID        => ['$eq', '$in'],
    FileInterface::ATTR_KIND             => ['$eq', '$in'],
    FileInterface::ATTR_COLLECTION       => ['$eq', '$in'],
    FileInterface::ATTR_MIME_TYPE        => ['$eq', '$in', '$contains'],
    FileInterface::ATTR_FILEABLE_TYPE    => ['$eq', '$in'],
    FileInterface::ATTR_FILEABLE_ID      => ['$eq', '$in'],
    FileInterface::ATTR_OWNER_ID         => ['$eq', '$in'],
    FileInterface::ATTR_VIRUS_SCAN_STATE => ['$eq', '$in'],
    FileInterface::ATTR_VISIBILITY       => ['$eq'],
    FileInterface::ATTR_IS_SYSTEM        => ['$eq'],
])]
final class EloquentFileRepository extends Repository implements FileRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findBySha256(string $tenantId, string $sha256): ?File
    {
        /** @var File|null $row */
        $row = $this->query()
            ->where(FileInterface::ATTR_TENANT_ID, $tenantId)
            ->where(FileInterface::ATTR_SHA256, $sha256)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findByFileable(string $fileableType, string $fileableId): Collection
    {
        /** @var Collection<int, File> $rows */
        $rows = $this->query()
            ->where(FileInterface::ATTR_FILEABLE_TYPE, $fileableType)
            ->where(FileInterface::ATTR_FILEABLE_ID, $fileableId)
            ->orderByDesc(FileInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     *
     * Cross-tenant scan — the antivirus dashboard is platform-only,
     * so the tenant global scope does NOT apply here.
     */
    public function findQuarantined(): Collection
    {
        /** @var Collection<int, File> $rows */
        $rows = $this->query()
            ->withoutGlobalScopes()
            ->where(FileInterface::ATTR_VIRUS_SCAN_STATE, VirusScanState::Quarantined->value)
            ->orderByDesc(FileInterface::ATTR_SCANNED_AT)
            ->get();

        return $rows;
    }
}
