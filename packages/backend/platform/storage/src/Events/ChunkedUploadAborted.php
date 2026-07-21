<?php

declare(strict_types=1);

namespace Stackra\Storage\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Storage\Models\ChunkedUpload;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when a chunked upload is aborted (client cancel, timeout,
 * verification failure). Listeners release provider-side resources.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'storage.chunked_upload.aborted')]
final readonly class ChunkedUploadAborted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public ChunkedUpload $upload,
        public string $reason,
    ) {
    }
}
