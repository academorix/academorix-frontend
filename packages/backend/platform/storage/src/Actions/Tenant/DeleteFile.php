<?php

declare(strict_types=1);

namespace Stackra\Storage\Actions\Tenant;

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
 * `DELETE /api/v1/files/{file}` — soft-delete. The blob stays in
 * the retention window; hard-delete goes through the platform
 * force-delete endpoint.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.tenant.delete')]
#[Delete('/api/v1/files/{file}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'storage.tenant.scope'])]
#[RequirePermission(StoragePermission::ManageOwn)]
final class DeleteFile
{
    use AsController;

    public function __invoke(File $file): JsonResponse
    {
        $file->delete();

        return \response()->json([], HttpResponse::HTTP_NO_CONTENT);
    }
}
