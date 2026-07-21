<?php

declare(strict_types=1);

namespace Stackra\Storage\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Storage\Models\File;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched after the File create transaction commits — safe to
 * enqueue jobs off this event.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'storage.file.uploaded')]
final readonly class FileUploaded implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public File $file)
    {
    }
}
