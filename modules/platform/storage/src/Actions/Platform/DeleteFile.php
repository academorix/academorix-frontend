<?php

declare(strict_types=1);

namespace Academorix\Storage\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Storage\Enums\StoragePermission;
use Academorix\Storage\Models\File;
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
