<?php

declare(strict_types=1);

namespace Stackra\Storage\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Storage\Contracts\Data\FileInterface;
use Stackra\Storage\Contracts\Repositories\FileRepositoryInterface;
use Stackra\Storage\Enums\VirusScanState;
use Stackra\Storage\Models\File;
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
