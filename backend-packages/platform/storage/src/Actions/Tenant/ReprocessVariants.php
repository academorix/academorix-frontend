<?php

declare(strict_types=1);

namespace Academorix\Storage\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Storage\Enums\StoragePermission;
use Academorix\Storage\Jobs\GenerateFileVariantsJob;
use Academorix\Storage\Models\File;
use Illuminate\Http\JsonResponse;

/**
 * `POST /api/v1/files/{file}/reprocess-variants` — force async
 * regeneration of every variant declared by the file's kind.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.tenant.variants.reprocess')]
#[Post('/api/v1/files/{file}/reprocess-variants')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'storage.tenant.scope'])]
#[RequirePermission(StoragePermission::ManageOwn)]
final class ReprocessVariants
{
    use AsController;

    public function __invoke(File $file): JsonResponse
    {
        GenerateFileVariantsJob::dispatch((string) $file->getKey());

        return \response()->json(['queued' => true]);
    }
}
