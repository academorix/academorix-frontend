<?php

declare(strict_types=1);

namespace Stackra\Storage\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Storage\Contracts\Services\ChunkedUploadCoordinatorInterface;
use Stackra\Storage\Enums\StoragePermission;
use Stackra\Storage\Models\ChunkedUpload;
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
