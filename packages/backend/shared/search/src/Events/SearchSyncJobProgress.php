<?php

declare(strict_types=1);

namespace Stackra\Search\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Progress heartbeat for a running `SearchSyncJob`.
 *
 * Broadcast-only — not `ShouldDispatchAfterCommit`, not durable.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'search.sync_job.progress')]
final readonly class SearchSyncJobProgress
{
    use Dispatchable;

    /**
     * @param  array<string, int>  $counters  Progress counters
     *                                        (`total`, `indexed`,
     *                                        `updated`, `skipped`,
     *                                        `failed`, `deleted`).
     */
    public function __construct(
        public string $searchSyncJobId,
        public int $progressPercent,
        public array $counters,
    ) {
    }
}
