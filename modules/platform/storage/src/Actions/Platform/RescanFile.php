<?php

declare(strict_types=1);

namespace Academorix\Storage\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Storage\Enums\StoragePermission;
use Academorix\Storage\Jobs\ScanFileForVirusesJob;
use Academorix\Storage\Models\File;
use Illuminate\Http\JsonResponse;

/**
 * `POST /api/v1/platform/files/{file}/rescan` — requeue AV scan.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.platform.rescan')]
#[Post('/api/v1/platform/files/{file}/rescan')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(StoragePermission::Manage)]
final class RescanFile
{
    use AsController;

    public function __invoke(File $file): JsonResponse
    {
        ScanFileForVirusesJob::dispatch((string) $file->getKey());

        return \response()->json(['queued' => true]);
    }
}
