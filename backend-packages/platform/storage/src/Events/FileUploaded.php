<?php

declare(strict_types=1);

namespace Academorix\Storage\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Storage\Models\File;
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
