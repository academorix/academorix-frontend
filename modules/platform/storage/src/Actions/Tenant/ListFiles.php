<?php

declare(strict_types=1);

namespace Academorix\Storage\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Storage\Contracts\Repositories\FileRepositoryInterface;
use Academorix\Storage\Data\FileData;
use Academorix\Storage\Enums\StoragePermission;
use Academorix\Storage\Models\File;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/files` — list files owned by the caller tenant.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.tenant.list')]
#[Get('/api/v1/files')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'storage.tenant.scope'])]
#[RequirePermission(StoragePermission::ManageOwn)]
final class ListFiles
{
    use AsController;

    public function __construct(
        private readonly FileRepositoryInterface $files,
    ) {
    }

    /**
     * @return DataCollection<int, FileData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->files->query()
            ->latest()
            ->limit(50)
            ->get()
            ->map(static fn (File $f): FileData => FileData::fromModel($f));

        return new DataCollection(FileData::class, $rows);
    }
}
