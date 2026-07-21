<?php

declare(strict_types=1);

namespace Stackra\Storage\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Storage\Contracts\Data\FileInterface;
use Stackra\Storage\Contracts\Services\SignedUrlIssuerInterface;
use Stackra\Storage\Data\FileData;
use Stackra\Storage\Enums\StoragePermission;
use Stackra\Storage\Enums\VirusScanState;
use Stackra\Storage\Events\FileVirusFound;
use Stackra\Storage\Models\File;

/**
 * `POST /api/v1/platform/files/{file}/quarantine` — manually
 * quarantine a file. Fires {@see FileVirusFound} + revokes every
 * live signed URL.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.platform.quarantine')]
#[Post('/api/v1/platform/files/{file}/quarantine')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(StoragePermission::Manage)]
final class QuarantineFile
{
    use AsController;

    public function __construct(
        private readonly SignedUrlIssuerInterface $issuer,
    ) {
    }

    public function __invoke(File $file): FileData
    {
        $file->update([
            FileInterface::ATTR_VIRUS_SCAN_STATE => VirusScanState::Quarantined->value,
            FileInterface::ATTR_SCANNED_AT       => \now(),
        ]);

        $this->issuer->revokeAllForFile((string) $file->getKey(), 'quarantined');
        FileVirusFound::dispatch($file, ['signature' => 'manual']);

        return FileData::fromModel($file->refresh());
    }
}
