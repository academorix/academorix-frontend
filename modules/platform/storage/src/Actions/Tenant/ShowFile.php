<?php

declare(strict_types=1);

namespace Academorix\Storage\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Storage\Data\FileData;
use Academorix\Storage\Enums\StoragePermission;
use Academorix\Storage\Models\File;

/**
 * `GET /api/v1/files/{file}` — single file with fresh signed URLs.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.tenant.show')]
#[Get('/api/v1/files/{file}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'storage.tenant.scope'])]
#[RequirePermission(StoragePermission::ManageOwn)]
final class ShowFile
{
    use AsController;

    public function __invoke(File $file): FileData
    {
        return FileData::fromModel($file);
    }
}
