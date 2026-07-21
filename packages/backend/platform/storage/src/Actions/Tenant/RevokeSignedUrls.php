<?php

declare(strict_types=1);

namespace Stackra\Storage\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Storage\Contracts\Services\SignedUrlIssuerInterface;
use Stackra\Storage\Enums\StoragePermission;
use Stackra\Storage\Models\File;
use Illuminate\Http\JsonResponse;

/**
 * `DELETE /api/v1/files/{file}/signed-urls` — revoke every active
 * signed URL for this file.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.tenant.signed_urls.revoke')]
#[Delete('/api/v1/files/{file}/signed-urls')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'storage.tenant.scope'])]
#[RequirePermission(StoragePermission::ManageOwn)]
final class RevokeSignedUrls
{
    use AsController;

    public function __construct(
        private readonly SignedUrlIssuerInterface $issuer,
    ) {
    }

    public function __invoke(File $file): JsonResponse
    {
        $count = $this->issuer->revokeAllForFile((string) $file->getKey(), 'admin_bulk_revoke');

        return \response()->json(['revoked' => $count]);
    }
}
