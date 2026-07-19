<?php

declare(strict_types=1);

namespace Academorix\Search\Jobs;

use Academorix\Search\Contracts\Repositories\SearchAnalyticsEventRepositoryInterface;
use Academorix\Search\Contracts\Repositories\SearchSyncJobRepositoryInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Retention pruner — hard-deletes analytics rows past their tier
 * window + scrubs raw query text past the GDPR window + prunes stale
 * sync jobs.
 *
 * Runs daily via schedule; idempotent.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(2)]
final class PruneSearchAnalyticsJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    #[UniqueFor(86400)]
    public function uniqueId(): string
    {
        return 'search-analytics-prune';
    }

    public function handle(
        SearchAnalyticsEventRepositoryInterface $analytics,
        SearchSyncJobRepositoryInterface $syncJobs,
    ): void {
        // Scaffold — call the pruner + scrubber. Full retention
        // pipeline (query-text scrub, stale sweep, hard-delete
        // grace) lands with the schedule build-out.
        unset($analytics, $syncJobs);
    }

    public function failed(\Throwable $e): void
    {
        unset($e);
    }
}
