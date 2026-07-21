<?php

declare(strict_types=1);

namespace Stackra\Storage\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Storage\Contracts\Data\FileVariantInterface;
use Stackra\Storage\Contracts\Repositories\FileVariantRepositoryInterface;
use Stackra\Storage\Models\FileVariant;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see FileVariantRepositoryInterface}.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(FileVariantInterface::class)]
#[Cacheable(ttl: 300, tags: true)]
#[Filterable([
    FileVariantInterface::ATTR_TENANT_ID   => ['$eq', '$in'],
    FileVariantInterface::ATTR_FILE_ID     => ['$eq', '$in'],
    FileVariantInterface::ATTR_VARIANT_KEY => ['$eq', '$in'],
])]
final class EloquentFileVariantRepository extends Repository implements FileVariantRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByFile(string $fileId): Collection
    {
        /** @var Collection<int, FileVariant> $rows */
        $rows = $this->query()
            ->where(FileVariantInterface::ATTR_FILE_ID, $fileId)
            ->orderBy(FileVariantInterface::ATTR_VARIANT_KEY)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findVariant(string $fileId, string $variantKey): ?FileVariant
    {
        /** @var FileVariant|null $row */
        $row = $this->query()
            ->where(FileVariantInterface::ATTR_FILE_ID, $fileId)
            ->where(FileVariantInterface::ATTR_VARIANT_KEY, $variantKey)
            ->first();

        return $row;
    }
}
