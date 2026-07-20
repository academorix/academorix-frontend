<?php

declare(strict_types=1);

namespace Academorix\Storage\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Storage\Models\File;
use Academorix\Storage\Repositories\EloquentFileRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see File}.
 *
 * @extends RepositoryInterface<File>
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Bind(EloquentFileRepository::class)]
interface FileRepositoryInterface extends RepositoryInterface
{
    /**
     * Find a File within a tenant by its content hash.
     *
     * Used by the upload path to dedupe: two tenants uploading the
     * same PDF share the physical blob but hold separate rows.
     */
    public function findBySha256(string $tenantId, string $sha256): ?File;

    /**
     * Every File attached to a specific polymorphic parent.
     *
     * @return Collection<int, File>
     */
    public function findByFileable(string $fileableType, string $fileableId): Collection;

    /**
     * Every File currently in `quarantined` state — powers the
     * antivirus dashboard.
     *
     * @return Collection<int, File>
     */
    public function findQuarantined(): Collection;
}
