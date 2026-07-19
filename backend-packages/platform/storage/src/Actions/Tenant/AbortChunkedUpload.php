<?php

declare(strict_types=1);

namespace Academorix\Storage\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Storage\Contracts\Services\ChunkedUploadCoordinatorInterface;
use Academorix\Storage\Enums\StoragePermission;
use Academorix\Storage\Models\ChunkedUpload;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

/**
 * `DELETE /api/v1/files/chunked/{upload}` — abort an in-flight
 * upload. Reclaims provider-side chunks + quota reservation.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.tenant.chunked.abort')]
#[Delete('/api/v1/files/chunked/{upload}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'storage.tenant.scope'])]
#[RequirePermission(StoragePermission::Upload)]
final class AbortChunkedUpload
{
    use AsController;

    public function __construct(
        private readonly ChunkedUploadCoordinatorInterface $coordinator,
    ) {
    }

    public function __invoke(ChunkedUpload $upload): JsonResponse
    {
        $this->coordinator->abort($upload, 'user_cancelled');

        return \response()->json([], HttpResponse::HTTP_NO_CONTENT);
    }
}
