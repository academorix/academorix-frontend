<?php

declare(strict_types=1);

namespace Stackra\Storage\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Storage\Contracts\Services\ChunkedUploadCoordinatorInterface;
use Stackra\Storage\Data\ChunkedUploadData;
use Stackra\Storage\Data\Requests\InitiateChunkedUploadRequestData;
use Stackra\Storage\Enums\StoragePermission;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `POST /api/v1/files/chunked` — initiate a chunked upload.
 *
 * Returns the ChunkedUpload row with `upload_url` — the client PATCHes
 * chunk bytes at that URL. Every subsequent read hides `upload_url`.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.tenant.chunked.initiate')]
#[Post('/api/v1/files/chunked')]
#[Middleware([
    'api',
    'resolve.tenant',
    'auth:sanctum',
    'tenant.user',
    'storage.quota.enforce',
    'storage.tenant.scope',
])]
#[RequirePermission(StoragePermission::Upload)]
final class InitiateChunkedUpload
{
    use AsController;

    public function __construct(
        private readonly ChunkedUploadCoordinatorInterface $coordinator,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(InitiateChunkedUploadRequestData $data): ChunkedUploadData
    {
        $tenant = $this->tenantContext->currentOrFail();
        $user   = \auth()->user();

        $chunkSize = $data->chunkSizeBytes ?? (int) \config('storage.chunked_uploads.chunk_size_bytes', 5_242_880);

        $upload = $this->coordinator->initiate([
            'tenant_id'            => (string) $tenant->getKey(),
            'owner_id'             => $user !== null ? (string) $user->getAuthIdentifier() : '',
            'target_kind'          => $data->targetKind,
            'target_fileable_type' => $data->targetFileableType,
            'target_fileable_id'   => $data->targetFileableId,
            'filename'             => $data->filename,
            'declared_mime_type'   => $data->declaredMimeType,
            'declared_sha256'      => $data->declaredSha256,
            'total_size_bytes'     => $data->totalSizeBytes,
            'chunk_size_bytes'     => $chunkSize,
            'protocol'             => $data->protocol,
        ]);

        // Initiate response DOES expose upload_url — this is the
        // only shape that surfaces it.
        return ChunkedUploadData::withUploadUrl($upload);
    }
}
