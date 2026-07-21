<?php

declare(strict_types=1);

namespace Stackra\Search\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Search\Models\SearchSyncJob;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a `SearchSyncJob` row is inserted with `status=queued`.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'search.sync_job.queued')]
final readonly class SearchSyncJobQueued implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public SearchSyncJob $job)
    {
    }
}
