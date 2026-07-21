<?php

declare(strict_types=1);

namespace Stackra\Transfer\Contracts\Services;

use Stackra\Transfer\Enums\XferArtifactKind;
use Stackra\Transfer\Models\XferArtifact;
use Stackra\Transfer\Services\NullArtifactStorage;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for artifact filesystem I/O.
 *
 * Every read + write against an artifact goes through this seam so
 * consumer apps can override with a bespoke storage strategy (S3
 * multipart, versioned buckets, encrypted-at-rest volumes) by
 * binding through this interface's `#[Bind]` attribute.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Bind(NullArtifactStorage::class)]
interface ArtifactStorageInterface
{
    /**
     * Persist a local file onto the configured disk for the given kind
     * and return a fresh `XferArtifact` row.
     *
     * @param  string             $localPath   Absolute path on the local filesystem.
     * @param  XferArtifactKind   $kind        Which artifact kind (drives the disk + path map).
     * @param  string|null        $xferJobId   Owning job id, or null for stand-alone artifacts.
     */
    public function store(string $localPath, XferArtifactKind $kind, ?string $xferJobId = null): XferArtifact;

    /**
     * Stream an artifact's bytes back to the caller.
     */
    public function read(XferArtifact $artifact): string;

    /**
     * Delete the file backing the artifact + null its `path`,
     * `size_bytes`, `checksum_sha256`; stamp `purged_at = now()`.
     */
    public function purge(XferArtifact $artifact): void;
}
