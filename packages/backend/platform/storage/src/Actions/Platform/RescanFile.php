<?php

declare(strict_types=1);

namespace Stackra\Storage\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Storage\Enums\StoragePermission;
use Stackra\Storage\Jobs\ScanFileForVirusesJob;
use Stackra\Storage\Models\File;
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
