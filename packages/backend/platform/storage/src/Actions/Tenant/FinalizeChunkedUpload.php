<?php

declare(strict_types=1);

namespace Stackra\Storage\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Storage\Contracts\Services\ChunkedUploadCoordinatorInterface;
use Stackra\Storage\Data\FileData;
use Stackra\Storage\Enums\StoragePermission;
use Stackra\Storage\Models\ChunkedUpload;

/**
 * `POST /api/v1/files/chunked/{upload}/finalize` — assemble +
 * verify + materialise a File row.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.tenant.chunked.finalize')]
#[Post('/api/v1/files/chunked/{upload}/finalize')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'storage.tenant.scope'])]
#[RequirePermission(StoragePermission::Upload)]
final class FinalizeChunkedUpload
{
    use AsController;

    public function __construct(
        private readonly ChunkedUploadCoordinatorInterface $coordinator,
    ) {
    }

    public function __invoke(ChunkedUpload $upload): FileData
    {
        $file = $this->coordinator->finalize($upload);

        return FileData::fromModel($file);
    }
}
