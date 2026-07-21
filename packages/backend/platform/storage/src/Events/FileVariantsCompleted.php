<?php

declare(strict_types=1);

namespace Stackra\Storage\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Storage\Models\File;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when every requested variant recipe has completed on a
 * file — the file is now considered fully processed.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'storage.file.variants_completed')]
final readonly class FileVariantsCompleted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  array<int, string>  $variantKeys Ordered keys generated.
     */
    public function __construct(
        public File $file,
        public array $variantKeys,
    ) {
    }
}
