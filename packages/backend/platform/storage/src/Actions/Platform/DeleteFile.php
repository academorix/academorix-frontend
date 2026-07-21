<?php

declare(strict_types=1);

namespace Stackra\Storage\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Storage\Enums\StoragePermission;
use Stackra\Storage\Models\File;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

/**
 * `DELETE /api/v1/platform/files/{file}` — immediate hard-delete.
 * Bypasses retention. Cascades to variants + audits + decrements
 * blob refcount.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.platform.hard_delete')]
#[Delete('/api/v1/platform/files/{file}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(StoragePermission::Manage)]
final class DeleteFile
{
    use AsController;

    public function __invoke(File $file): JsonResponse
    {
        $file->forceDelete();

        return \response()->json([], HttpResponse::HTTP_NO_CONTENT);
    }
}
