<?php

declare(strict_types=1);

namespace Academorix\Storage\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Storage\Models\FileVariant;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when one variant recipe completes on a file.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'storage.file.variant_generated')]
final readonly class FileVariantGenerated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public FileVariant $variant)
    {
    }
}
