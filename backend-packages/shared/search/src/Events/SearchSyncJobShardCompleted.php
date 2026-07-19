<?php

declare(strict_types=1);

namespace Academorix\Search\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when one shard of a sharded reindex terminates.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'search.sync_job.shard_completed')]
final readonly class SearchSyncJobShardCompleted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  array<string, int>  $shardCounters  Per-shard counters.
     */
    public function __construct(
        public string $searchSyncJobId,
        public int $shardIndex,
        public string $shardStatus,
        public array $shardCounters,
    ) {
    }
}
