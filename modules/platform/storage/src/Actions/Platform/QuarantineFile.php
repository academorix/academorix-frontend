<?php

declare(strict_types=1);

namespace Academorix\Storage\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Storage\Contracts\Data\FileInterface;
use Academorix\Storage\Contracts\Services\SignedUrlIssuerInterface;
use Academorix\Storage\Data\FileData;
use Academorix\Storage\Enums\StoragePermission;
use Academorix\Storage\Enums\VirusScanState;
use Academorix\Storage\Events\FileVirusFound;
use Academorix\Storage\Models\File;

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
