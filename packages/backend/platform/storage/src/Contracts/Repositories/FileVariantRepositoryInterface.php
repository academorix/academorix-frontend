<?php

declare(strict_types=1);

namespace Stackra\Storage\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Storage\Models\FileVariant;
use Stackra\Storage\Repositories\EloquentFileVariantRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see FileVariant}.
 *
 * @extends RepositoryInterface<FileVariant>
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Bind(EloquentFileVariantRepository::class)]
interface FileVariantRepositoryInterface extends RepositoryInterface
{
    /**
     * Every variant belonging to a File.
     *
     * @return Collection<int, FileVariant>
     */
    public function findByFile(string $fileId): Collection;

    /**
     * A specific variant for a File by variant key.
     */
    public function findVariant(string $fileId, string $variantKey): ?FileVariant;
}
