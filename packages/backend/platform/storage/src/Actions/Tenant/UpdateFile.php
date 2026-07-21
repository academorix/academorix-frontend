<?php

declare(strict_types=1);

namespace Stackra\Storage\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;
use Stackra\Storage\Contracts\Data\FileInterface;
use Stackra\Storage\Data\FileData;
use Stackra\Storage\Data\Requests\UpdateFileRequestData;
use Stackra\Storage\Enums\StoragePermission;
use Stackra\Storage\Models\File;

/**
 * `PATCH /api/v1/files/{file}` — update display name / visibility
 * / metadata. Every other column is immutable or module-managed.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.tenant.update')]
#[Patch('/api/v1/files/{file}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'storage.tenant.scope'])]
#[RequirePermission(StoragePermission::ManageOwn)]
final class UpdateFile
{
    use AsController;

    public function __invoke(File $file, UpdateFileRequestData $data): FileData
    {
        $payload = [];
        if ($data->name !== null) {
            $payload[FileInterface::ATTR_NAME] = $data->name;
        }
        if ($data->visibility !== null) {
            $payload[FileInterface::ATTR_VISIBILITY] = $data->visibility->value;
        }
        if ($data->metadata !== null) {
            $payload[FileInterface::ATTR_METADATA] = $data->metadata;
        }

        if ($payload !== []) {
            $file->update($payload);
        }

        return FileData::fromModel($file->refresh());
    }
}
