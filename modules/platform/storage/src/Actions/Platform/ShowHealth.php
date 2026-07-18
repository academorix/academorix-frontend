<?php

declare(strict_types=1);

namespace Academorix\Storage\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Storage\Contracts\Data\ChunkedUploadInterface;
use Academorix\Storage\Contracts\Data\FileInterface;
use Academorix\Storage\Enums\ChunkedUploadState;
use Academorix\Storage\Enums\StoragePermission;
use Academorix\Storage\Enums\VirusScanState;
use Academorix\Storage\Models\ChunkedUpload;
use Academorix\Storage\Models\File;
use Illuminate\Http\JsonResponse;

/**
 * `GET /api/v1/platform/storage/health` — live storage pipeline
 * status: AV queue depth, chunked-upload counts by state.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.platform.health')]
#[Get('/api/v1/platform/storage/health')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(StoragePermission::View)]
final class ShowHealth
{
    use AsController;

    public function __invoke(): JsonResponse
    {
        $pending = (int) File::query()
            ->withoutGlobalScopes()
            ->where(FileInterface::ATTR_VIRUS_SCAN_STATE, VirusScanState::Pending->value)
            ->count();

        $scanning = (int) File::query()
            ->withoutGlobalScopes()
            ->where(FileInterface::ATTR_VIRUS_SCAN_STATE, VirusScanState::Scanning->value)
            ->count();

        $quarantined = (int) File::query()
            ->withoutGlobalScopes()
            ->where(FileInterface::ATTR_VIRUS_SCAN_STATE, VirusScanState::Quarantined->value)
            ->count();

        $uploading = (int) ChunkedUpload::query()
            ->withoutGlobalScopes()
            ->where(ChunkedUploadInterface::ATTR_STATE, ChunkedUploadState::Uploading->value)
            ->count();

        $finalizing = (int) ChunkedUpload::query()
            ->withoutGlobalScopes()
            ->where(ChunkedUploadInterface::ATTR_STATE, ChunkedUploadState::Finalizing->value)
            ->count();

        return \response()->json([
            'antivirus' => [
                'pending'     => $pending,
                'scanning'    => $scanning,
                'quarantined' => $quarantined,
            ],
            'chunked_uploads' => [
                'uploading'  => $uploading,
                'finalizing' => $finalizing,
            ],
        ]);
    }
}
