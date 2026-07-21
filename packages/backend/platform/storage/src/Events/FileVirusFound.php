<?php

declare(strict_types=1);

namespace Stackra\Storage\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Storage\Models\File;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when the scanner reports a threat — the file is now
 * `virus_scan_state = quarantined`. Listeners typically notify the
 * uploader + the security channel.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'storage.file.virus_found')]
final readonly class FileVirusFound implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  array<string, mixed>  $details Scanner-provided threat details.
     */
    public function __construct(
        public File $file,
        public array $details,
    ) {
    }
}
