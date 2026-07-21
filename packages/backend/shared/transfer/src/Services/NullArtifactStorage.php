<?php

declare(strict_types=1);

namespace Stackra\Transfer\Services;

use Stackra\Transfer\Contracts\Data\XferArtifactInterface;
use Stackra\Transfer\Contracts\Services\ArtifactStorageInterface;
use Stackra\Transfer\Enums\XferArtifactKind;
use Stackra\Transfer\Models\XferArtifact;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default implementation of {@see ArtifactStorageInterface}.
 *
 * Persists the artifact ledger row + records the local path — a
 * safe default for local development. Production consumers override
 * by binding a real S3 / MinIO / Azure Blob adapter through the
 * interface's `#[Bind]` attribute.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Singleton]
final class NullArtifactStorage implements ArtifactStorageInterface
{
    /**
     * {@inheritDoc}
     */
    public function store(string $localPath, XferArtifactKind $kind, ?string $xferJobId = null): XferArtifact
    {
        // Minimal shape — create an artifact row pointing at the
        // local file. A real adapter uploads the file to its disk
        // and stamps disk / path / size / checksum accordingly.
        return XferArtifact::query()->create([
            XferArtifactInterface::ATTR_XFER_JOB_ID  => $xferJobId,
            XferArtifactInterface::ATTR_KIND         => $kind->value,
            XferArtifactInterface::ATTR_DISK         => (string) \config('transfer.storage.default_disk', 'local'),
            XferArtifactInterface::ATTR_PATH         => $localPath,
            XferArtifactInterface::ATTR_FILENAME     => \basename($localPath),
            XferArtifactInterface::ATTR_MIME_TYPE    => 'application/octet-stream',
            XferArtifactInterface::ATTR_SIZE_BYTES   => \file_exists($localPath) ? (int) \filesize($localPath) : 0,
        ]);
    }

    /**
     * {@inheritDoc}
     */
    public function read(XferArtifact $artifact): string
    {
        $path = (string) $artifact->{XferArtifactInterface::ATTR_PATH};
        if ($path === '' || ! \file_exists($path)) {
            return '';
        }

        return (string) \file_get_contents($path);
    }

    /**
     * {@inheritDoc}
     */
    public function purge(XferArtifact $artifact): void
    {
        $path = (string) $artifact->{XferArtifactInterface::ATTR_PATH};
        if ($path !== '' && \file_exists($path)) {
            @\unlink($path);
        }

        $artifact->fill([
            XferArtifactInterface::ATTR_PATH       => null,
            XferArtifactInterface::ATTR_PURGED_AT  => \now(),
        ])->save();
    }
}
