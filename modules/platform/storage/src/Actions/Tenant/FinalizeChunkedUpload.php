<?php

declare(strict_types=1);

namespace Academorix\Storage\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Storage\Contracts\Services\ChunkedUploadCoordinatorInterface;
use Academorix\Storage\Data\FileData;
use Academorix\Storage\Enums\StoragePermission;
use Academorix\Storage\Models\ChunkedUpload;

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
