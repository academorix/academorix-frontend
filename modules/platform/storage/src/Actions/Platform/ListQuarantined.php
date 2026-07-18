<?php

declare(strict_types=1);

namespace Academorix\Storage\Actions\Platform;

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
