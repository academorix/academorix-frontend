<?php

declare(strict_types=1);

namespace Stackra\Storage\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Storage\Data\FileData;
use Stackra\Storage\Enums\StoragePermission;
use Stackra\Storage\Models\File;

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
