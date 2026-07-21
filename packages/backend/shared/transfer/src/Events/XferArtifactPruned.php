<?php

declare(strict_types=1);

namespace Stackra\Transfer\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Transfer\Models\XferArtifact;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when an {@see XferArtifact} file is deleted from disk by
 * `PruneXferArtifactsJob`. The row survives; `path` is nulled and
 * `purged_at` is stamped.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'transfer.artifact.pruned')]
final readonly class XferArtifactPruned
{
    use Dispatchable;

    /**
     * @param  XferArtifact  $artifact  The tombstoned artifact row.
     */
    public function __construct(public XferArtifact $artifact)
    {
    }
}
