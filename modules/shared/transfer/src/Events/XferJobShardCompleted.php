<?php

declare(strict_types=1);

namespace Academorix\Transfer\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Transfer\Models\XferShard;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when a {@see XferShard} transitions to `succeeded` or
 * `failed`. Coordinator jobs listen to aggregate counters into the
 * parent {@see \Academorix\Transfer\Models\XferJob}.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'transfer.job.shard_completed')]
final readonly class XferJobShardCompleted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  XferShard  $shard  The shard that just completed.
     */
    public function __construct(public XferShard $shard)
    {
    }
}
