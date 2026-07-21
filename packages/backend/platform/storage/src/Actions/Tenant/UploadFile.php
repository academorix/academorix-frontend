<?php

declare(strict_types=1);

namespace Stackra\Storage\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Storage\Contracts\Data\FileInterface;
use Stackra\Storage\Contracts\Repositories\FileRepositoryInterface;
use Stackra\Storage\Data\FileData;
use Stackra\Storage\Data\Requests\UploadFileRequestData;
use Stackra\Storage\Enums\StoragePermission;
use Stackra\Storage\Models\File;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Illuminate\Support\Str;

/**
 * `POST /api/v1/files` — single-request upload.
 *
 * The uploaded file bytes land in a File row with
 * `virus_scan_state = pending`. The observer dispatches
 * {@see \Stackra\Storage\Jobs\ScanFileForVirusesJob} +
 * {@see \Stackra\Storage\Jobs\GenerateFileVariantsJob} on commit.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.tenant.upload')]
#[Post('/api/v1/files')]
#[Middleware([
    'api',
    'resolve.tenant',
    'auth:sanctum',
    'tenant.user',
    'storage.mime.validate',
    'storage.size.validate',
    'storage.quota.enforce',
    'storage.tenant.scope',
])]
#[RequirePermission(StoragePermission::Upload)]
final class UploadFile
{
    use AsController;

    public function __construct(
        private readonly FileRepositoryInterface $files,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(UploadFileRequestData $data): FileData
    {
        $tenant = $this->tenantContext->currentOrFail();

        $upload   = $data->file;
        $stream   = $upload->openFile('r');
        $contents = $stream->fread((int) $upload->getSize()) ?: '';
        $sha256   = \hash('sha256', $contents);

        // Dedup: same tenant + same sha => reuse the existing row.
        $existing = $this->files->findBySha256((string) $tenant->getKey(), $sha256);
        if ($existing !== null) {
            return FileData::fromModel($existing);
        }

        $kind       = $data->kind;
        $collection = $data->collection ?? 'default';
        $disk       = (string) \config("storage.disks.per_kind.{$kind}", \config('storage.disks.default', 'local'));

        $path = \sprintf(
            'tenants/%s/%s/%s/%s/%s',
            $tenant->getKey(),
            $kind,
            \substr($sha256, 0, 2),
            \substr($sha256, 2, 2),
            $sha256,
        );

        /** @var File $file */
        $file = $this->files->create([
            FileInterface::ATTR_ID            => 'fil_' . Str::ulid()->toBase32(),
            FileInterface::ATTR_TENANT_ID     => (string) $tenant->getKey(),
            FileInterface::ATTR_KIND          => $kind,
            FileInterface::ATTR_COLLECTION    => $collection,
            FileInterface::ATTR_FILENAME      => $upload->getClientOriginalName(),
            FileInterface::ATTR_NAME          => $data->name ?? $upload->getClientOriginalName(),
            FileInterface::ATTR_MIME_TYPE     => $upload->getMimeType() ?? 'application/octet-stream',
            FileInterface::ATTR_SIZE_BYTES    => (int) $upload->getSize(),
            FileInterface::ATTR_SHA256        => $sha256,
            FileInterface::ATTR_DISK          => $disk,
            FileInterface::ATTR_PATH          => $path,
            FileInterface::ATTR_VISIBILITY    => ($data->visibility?->value) ?? 'private',
            FileInterface::ATTR_FILEABLE_TYPE => $data->fileableType,
            FileInterface::ATTR_FILEABLE_ID   => $data->fileableId,
            FileInterface::ATTR_METADATA      => $data->metadata,
        ]);

        return FileData::fromModel($file);
    }
}
