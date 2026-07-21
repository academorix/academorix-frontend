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
 * `GET /api/v1/platform/files/quarantined` — antivirus dashboard.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.platform.quarantined')]
#[Get('/api/v1/platform/files/quarantined')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(StoragePermission::View)]
final class ListQuarantined
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
        $rows = $this->files
            ->findQuarantined()
            ->map(static fn (File $f): FileData => FileData::fromModel($f));

        return new DataCollection(FileData::class, $rows);
    }
}
