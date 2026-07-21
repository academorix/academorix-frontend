<?php

declare(strict_types=1);

namespace Stackra\Storage\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when a File row is hard-deleted — the physical bytes may
 * or may not be gone (depends on the content-addressable refcount).
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'storage.file.erased')]
final readonly class FileErased implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $fileId,
        public string $tenantId,
        public string $sha256,
    ) {
    }
}
