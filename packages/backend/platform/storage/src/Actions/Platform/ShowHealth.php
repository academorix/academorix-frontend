<?php

declare(strict_types=1);

namespace Stackra\Storage\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Storage\Contracts\Data\ChunkedUploadInterface;
use Stackra\Storage\Contracts\Data\FileInterface;
use Stackra\Storage\Enums\ChunkedUploadState;
use Stackra\Storage\Enums\StoragePermission;
use Stackra\Storage\Enums\VirusScanState;
use Stackra\Storage\Models\ChunkedUpload;
use Stackra\Storage\Models\File;
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
