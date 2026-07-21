<?php

declare(strict_types=1);

namespace Stackra\Storage\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Storage\Contracts\Repositories\FileRepositoryInterface;
use Stackra\Storage\Data\FileData;
use Stackra\Storage\Enums\StoragePermission;
use Stackra\Storage\Models\File;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/files` — cross-tenant file inspection.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.platform.list')]
#[Get('/api/v1/platform/files')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(StoragePermission::View)]
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
        // Platform view — bypass the tenant global scope.
        $rows = $this->files->query()
            ->withoutGlobalScopes()
            ->latest()
            ->limit(100)
            ->get()
            ->map(static fn (File $f): FileData => FileData::fromModel($f));

        return new DataCollection(FileData::class, $rows);
    }
}
