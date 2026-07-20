<?php

declare(strict_types=1);

namespace Academorix\Storage\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Storage\Models\File;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when a File's `archived_at` column is set — the row keeps
 * the blob for the retention window before hard-delete.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'storage.file.archived')]
final readonly class FileArchived implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public File $file)
    {
    }
}
