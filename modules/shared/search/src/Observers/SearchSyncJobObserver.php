<?php

declare(strict_types=1);

namespace Academorix\Search\Observers;

use Academorix\Search\Contracts\Data\SearchSyncJobInterface;
use Academorix\Search\Enums\SearchSyncJobStatus;
use Academorix\Search\Events\SearchSyncJobCancelled;
use Academorix\Search\Events\SearchSyncJobCompleted;
use Academorix\Search\Events\SearchSyncJobFailed;
use Academorix\Search\Events\SearchSyncJobQueued;
use Academorix\Search\Events\SearchSyncJobStarted;
use Academorix\Search\Models\SearchSyncJob;

/**
 * Lifecycle side effects on {@see SearchSyncJob}.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchSyncJobObserver
{
    /**
     * `creating` — populate defaults from config.
     */
    public function creating(SearchSyncJob $job): void
    {
        if ($job->{SearchSyncJobInterface::ATTR_STATUS} === null) {
            $job->{SearchSyncJobInterface::ATTR_STATUS} = SearchSyncJobStatus::Queued;
        }

        if ($job->{SearchSyncJobInterface::ATTR_QUEUE_NAME} === null) {
            $job->{SearchSyncJobInterface::ATTR_QUEUE_NAME} =
                (string) \config('search.queue.name', 'search');
        }

        if ($job->{SearchSyncJobInterface::ATTR_RETENTION_TIER} === null) {
            $job->{SearchSyncJobInterface::ATTR_RETENTION_TIER} = 'medium';
        }
    }

    /**
     * `created` — announce the job to activity + audit + broadcast.
     */
    public function created(SearchSyncJob $job): void
    {
        SearchSyncJobQueued::dispatch($job);
    }

    /**
     * `updated` — fan out status-transition events.
     */
    public function updated(SearchSyncJob $job): void
    {
        if (! $job->wasChanged(SearchSyncJobInterface::ATTR_STATUS)) {
            return;
        }

        $status = $job->{SearchSyncJobInterface::ATTR_STATUS};

        match (true) {
            $status === SearchSyncJobStatus::Running => SearchSyncJobStarted::dispatch($job),
            $status === SearchSyncJobStatus::Succeeded,
            $status === SearchSyncJobStatus::PartiallySucceeded => SearchSyncJobCompleted::dispatch($job),
            $status === SearchSyncJobStatus::Failed => SearchSyncJobFailed::dispatch($job),
            $status === SearchSyncJobStatus::Cancelled => SearchSyncJobCancelled::dispatch($job),
            default => null,
        };
    }
}
