<?php

declare(strict_types=1);

namespace Academorix\Storage\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Storage\Enums\VirusScanState;
use Academorix\Storage\Models\File;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired every time the antivirus scanner finishes a scan —
 * regardless of outcome (clean / quarantined / failed).
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'storage.file.scanned')]
final readonly class FileScanned implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public File $file,
        public VirusScanState $state,
    ) {
    }
}
