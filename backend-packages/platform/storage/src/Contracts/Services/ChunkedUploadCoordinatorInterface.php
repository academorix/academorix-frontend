<?php

declare(strict_types=1);

namespace Academorix\Storage\Contracts\Services;

use Academorix\Storage\Models\ChunkedUpload;
use Academorix\Storage\Models\File;
use Academorix\Storage\Services\DefaultChunkedUploadCoordinator;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the chunked-upload coordinator.
 *
 * Wraps the provider-specific multipart state (tus.io resource,
 * S3 UploadId) behind a uniform API. The default
 * {@see DefaultChunkedUploadCoordinator} uses Laravel Storage's
 * stream store — swap in a `TusUploadCoordinator` /
 * `S3MultipartCoordinator` with
 * `#[Overrides(ChunkedUploadCoordinatorInterface::class)]` on the
 * consumer-side concrete (Pattern B per
 * `.kiro/steering/php-attributes.md`).
 *
 * `#[Bind(DefaultChunkedUploadCoordinator::class)]` — Pattern A per
 * `.kiro/steering/php-attributes.md` §"Bind vs Overrides". The
 * interface owns the wiring; the concrete stays free of the binding
 * attribute and only carries its lifetime attribute (`#[Scoped]`).
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Bind(DefaultChunkedUploadCoordinator::class)]
interface ChunkedUploadCoordinatorInterface
{
    /**
     * Initiate a new multipart upload.
     *
     * @param  array<string, mixed> $spec  Upload specification —
     *                                     `tenant_id`, `owner_id`,
     *                                     `target_kind`, `filename`,
     *                                     `declared_mime_type`,
     *                                     `total_size_bytes`,
     *                                     `chunk_size_bytes`,
     *                                     `protocol`.
     * @return ChunkedUpload  The persisted row with `state =
     *                        initiating`. Response body of the
     *                        initiate endpoint includes the
     *                        `upload_url`.
     */
    public function initiate(array $spec): ChunkedUpload;

    /**
     * Receive one chunk against an in-flight upload.
     *
     * @param  ChunkedUpload  $upload  The parent row.
     * @param  int            $index   Zero-based chunk index.
     * @param  resource       $stream  PHP stream resource of the chunk bytes.
     * @param  string|null    $sha256  Optional client-supplied
     *                                 SHA-256 of the chunk.
     * @return ChunkedUpload  The updated row.
     */
    public function receiveChunk(ChunkedUpload $upload, int $index, $stream, ?string $sha256 = null): ChunkedUpload;

    /**
     * Finalise a chunked upload — assemble, verify, materialise a
     * {@see File}.
     *
     * @return File  The resulting file record.
     */
    public function finalize(ChunkedUpload $upload): File;

    /**
     * Abort an in-flight upload and release provider-side resources.
     */
    public function abort(ChunkedUpload $upload, string $reason): void;
}
