<?php

declare(strict_types=1);

namespace Academorix\Transfer\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Transfer\Models\XferArtifact;
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
