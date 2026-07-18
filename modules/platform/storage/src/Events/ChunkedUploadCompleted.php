<?php

declare(strict_types=1);

namespace Academorix\Storage\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Storage\Models\ChunkedUpload;
use Academorix\Storage\Models\File;
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
