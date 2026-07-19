<?php

declare(strict_types=1);

namespace Academorix\Storage\Services;

use Academorix\Storage\Contracts\Data\ChunkedUploadInterface;
use Academorix\Storage\Contracts\Data\FileInterface;
use Academorix\Storage\Contracts\Services\ChunkedUploadCoordinatorInterface;
use Academorix\Storage\Enums\ChunkedUploadState;
use Academorix\Storage\Events\ChunkedUploadAborted;
use Academorix\Storage\Events\ChunkedUploadCompleted;
use Academorix\Storage\Events\ChunkedUploadInitiated;
use Academorix\Storage\Models\ChunkedUpload;
use Academorix\Storage\Models\File;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Support\Str;

/**
 * Default {@see ChunkedUploadCoordinatorInterface} — laravel-storage
 * backed.
 *
 * `#[Scoped]` (not `#[Singleton]`) because it holds per-request
 * state during the multi-chunk upload path. The interface declares
 * the container binding via
 * `#[Bind(DefaultChunkedUploadCoordinator::class)]` (Pattern A per
 * `.kiro/steering/php-attributes.md`), so this concrete carries only
 * its lifetime attribute.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultChunkedUploadCoordinator implements ChunkedUploadCoordinatorInterface
{
    /**
     * {@inheritDoc}
     */
    public function initiate(array $spec): ChunkedUpload
    {
        $now      = \Carbon\CarbonImmutable::now();
        $expiryH  = (int) \config('storage.chunked_uploads.expiry_hours', 24);
        $chunkSz  = (int) \config('storage.chunked_uploads.chunk_size_bytes', 5_242_880);
        $protocol = (string) ($spec['protocol'] ?? \config('storage.chunked_uploads.default_protocol', 'tus'));

        /** @var ChunkedUpload $upload */
        $upload = ChunkedUpload::query()->create([
            ChunkedUploadInterface::ATTR_ID                 => 'chu_' . Str::ulid()->toBase32(),
            ChunkedUploadInterface::ATTR_TENANT_ID          => (string) ($spec['tenant_id'] ?? ''),
            ChunkedUploadInterface::ATTR_OWNER_ID           => (string) ($spec['owner_id'] ?? ''),
            ChunkedUploadInterface::ATTR_TARGET_KIND        => (string) ($spec['target_kind'] ?? 'other'),
            ChunkedUploadInterface::ATTR_TARGET_FILEABLE_TYPE => $spec['target_fileable_type'] ?? null,
            ChunkedUploadInterface::ATTR_TARGET_FILEABLE_ID => $spec['target_fileable_id'] ?? null,
            ChunkedUploadInterface::ATTR_PROTOCOL           => $protocol,
            ChunkedUploadInterface::ATTR_UPLOAD_URL         => $this->buildUploadUrl($protocol),
            ChunkedUploadInterface::ATTR_PROVIDER_UPLOAD_ID => Str::ulid()->toBase32(),
            ChunkedUploadInterface::ATTR_FILENAME           => (string) ($spec['filename'] ?? 'upload'),
            ChunkedUploadInterface::ATTR_DECLARED_MIME_TYPE => (string) ($spec['declared_mime_type'] ?? 'application/octet-stream'),
            ChunkedUploadInterface::ATTR_DECLARED_SHA256    => $spec['declared_sha256'] ?? null,
            ChunkedUploadInterface::ATTR_TOTAL_SIZE_BYTES   => (int) ($spec['total_size_bytes'] ?? 0),
            ChunkedUploadInterface::ATTR_UPLOADED_BYTES     => 0,
            ChunkedUploadInterface::ATTR_CHUNKS             => [],
            ChunkedUploadInterface::ATTR_CHUNK_SIZE_BYTES   => $chunkSz,
            ChunkedUploadInterface::ATTR_STATE              => ChunkedUploadState::Initiating->value,
            ChunkedUploadInterface::ATTR_EXPIRES_AT         => $now->addHours($expiryH),
            ChunkedUploadInterface::ATTR_INITIATED_AT       => $now,
        ]);

        ChunkedUploadInitiated::dispatch($upload);

        // Move to `uploading` immediately — the provider handle is
        // ready.
        $upload->update([ChunkedUploadInterface::ATTR_STATE => ChunkedUploadState::Uploading->value]);

        return $upload;
    }

    /**
     * {@inheritDoc}
     *
     * @param  resource  $stream
     */
    public function receiveChunk(ChunkedUpload $upload, int $index, $stream, ?string $sha256 = null): ChunkedUpload
    {
        // Compute size from stream — cheap for local dev, real
        // backends replace this call entirely.
        $stat = \fstat($stream);
        $size = \is_array($stat) && isset($stat['size']) ? (int) $stat['size'] : 0;

        /** @var array<int, array<string, mixed>> $chunks */
        $chunks   = $upload->{ChunkedUploadInterface::ATTR_CHUNKS} ?? [];
        $chunks[] = [
            'index'       => $index,
            'size'        => $size,
            'sha256'      => $sha256,
            'uploaded_at' => \Carbon\CarbonImmutable::now()->toIso8601String(),
        ];

        $upload->update([
            ChunkedUploadInterface::ATTR_CHUNKS         => $chunks,
            ChunkedUploadInterface::ATTR_UPLOADED_BYTES => (int) $upload->{ChunkedUploadInterface::ATTR_UPLOADED_BYTES} + $size,
        ]);

        return $upload->refresh();
    }

    /**
     * {@inheritDoc}
     */
    public function finalize(ChunkedUpload $upload): File
    {
        $upload->update([ChunkedUploadInterface::ATTR_STATE => ChunkedUploadState::Finalizing->value]);

        // Materialise the resulting File — in production this reaches
        // into the provider to assemble parts; here we create the
        // record from the declared metadata.
        $sha = (string) ($upload->{ChunkedUploadInterface::ATTR_DECLARED_SHA256}
            ?? \hash('sha256', (string) $upload->getKey()));

        /** @var File $file */
        $file = File::query()->create([
            FileInterface::ATTR_ID          => 'fil_' . Str::ulid()->toBase32(),
            FileInterface::ATTR_TENANT_ID   => $upload->{ChunkedUploadInterface::ATTR_TENANT_ID},
            FileInterface::ATTR_OWNER_ID    => $upload->{ChunkedUploadInterface::ATTR_OWNER_ID},
            FileInterface::ATTR_KIND        => $upload->{ChunkedUploadInterface::ATTR_TARGET_KIND},
            FileInterface::ATTR_COLLECTION  => 'default',
            FileInterface::ATTR_FILENAME    => $upload->{ChunkedUploadInterface::ATTR_FILENAME},
            FileInterface::ATTR_NAME        => $upload->{ChunkedUploadInterface::ATTR_FILENAME},
            FileInterface::ATTR_MIME_TYPE   => $upload->{ChunkedUploadInterface::ATTR_DECLARED_MIME_TYPE},
            FileInterface::ATTR_SIZE_BYTES  => (int) $upload->{ChunkedUploadInterface::ATTR_TOTAL_SIZE_BYTES},
            FileInterface::ATTR_SHA256      => $sha,
            FileInterface::ATTR_DISK        => (string) \config('storage.disks.default', 'local'),
            FileInterface::ATTR_PATH        => 'blobs/' . \substr($sha, 0, 2) . '/' . \substr($sha, 2, 2) . '/' . $sha,
        ]);

        $upload->update([
            ChunkedUploadInterface::ATTR_STATE            => ChunkedUploadState::Completed->value,
            ChunkedUploadInterface::ATTR_FINALIZED_AT     => \Carbon\CarbonImmutable::now(),
            ChunkedUploadInterface::ATTR_RESULTING_FILE_ID => $file->getKey(),
        ]);

        ChunkedUploadCompleted::dispatch($upload, $file);

        return $file;
    }

    /**
     * {@inheritDoc}
     */
    public function abort(ChunkedUpload $upload, string $reason): void
    {
        $upload->update([
            ChunkedUploadInterface::ATTR_STATE         => ChunkedUploadState::Aborted->value,
            ChunkedUploadInterface::ATTR_ABORT_REASON  => $reason,
            ChunkedUploadInterface::ATTR_FINALIZED_AT  => \Carbon\CarbonImmutable::now(),
        ]);

        ChunkedUploadAborted::dispatch($upload, $reason);
    }

    /**
     * Build a fresh provider-facing upload URL for the given
     * protocol. Local dev returns a bogus URL; production wires the
     * real S3-multipart / tus.io endpoint here.
     */
    private function buildUploadUrl(string $protocol): string
    {
        return \sprintf('/storage/%s/%s', $protocol, Str::random(24));
    }
}
