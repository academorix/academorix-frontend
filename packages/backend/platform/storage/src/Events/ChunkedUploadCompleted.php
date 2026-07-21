<?php

declare(strict_types=1);

namespace Stackra\Storage\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Storage\Models\ChunkedUpload;
use Stackra\Storage\Models\File;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when a chunked upload successfully finalises — the
 * resulting File row is now materialised.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'storage.chunked_upload.completed')]
final readonly class ChunkedUploadCompleted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public ChunkedUpload $upload,
        public File $file,
    ) {
    }
}
