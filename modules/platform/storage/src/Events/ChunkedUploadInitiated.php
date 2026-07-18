<?php

declare(strict_types=1);

namespace Academorix\Storage\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Storage\Models\ChunkedUpload;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when a chunked upload row is created — the provider handle
 * has been allocated and the client can start streaming chunks.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'storage.chunked_upload.initiated')]
final readonly class ChunkedUploadInitiated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public ChunkedUpload $upload)
    {
    }
}
