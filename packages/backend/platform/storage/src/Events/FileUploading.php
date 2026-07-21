<?php

declare(strict_types=1);

namespace Stackra\Storage\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Storage\Models\File;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched inside the create transaction — the File row exists
 * but its post-transaction observers have not yet fired.
 *
 * Listeners that need to reject the write raise from this event.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'storage.file.uploading')]
final readonly class FileUploading
{
    use Dispatchable;

    public function __construct(public File $file)
    {
    }
}
