<?php

declare(strict_types=1);

namespace Stackra\Geography\Listeners;

use Stackra\Geography\Events\MaxMindDatabaseStale;
use Stackra\Geography\Jobs\RefreshMaxMindDatabaseJob;

/**
 * Listener: `MaxMindDatabaseStale` → dispatch
 * {@see RefreshMaxMindDatabaseJob}.
 *
 * Kicks off a refresh as soon as the stale probe fires, without
 * waiting for the weekly schedule. `RefreshMaxMindDatabaseJob` is
 * `ShouldBeUnique` with a 24h window, so back-to-back stale events
 * do not spawn parallel refreshes.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class DispatchRefreshMaxMindOnStale
{
    /**
     * Handle a stale-database event by dispatching the refresh job.
     */
    public function handle(MaxMindDatabaseStale $event): void
    {
        RefreshMaxMindDatabaseJob::dispatch();
    }
}
