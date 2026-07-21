<?php

declare(strict_types=1);

namespace Stackra\Search\Services;

use Stackra\Search\Contracts\Data\SearchSyncJobInterface;
use Stackra\Search\Contracts\Repositories\SearchSyncJobRepositoryInterface;
use Stackra\Search\Contracts\Services\IndexOrchestratorInterface;
use Stackra\Search\Enums\SearchSyncJobStatus;
use Stackra\Search\Models\SearchSyncJob;
use Illuminate\Container\Attributes\Scoped;

/**
 * Minimum-viable {@see IndexOrchestratorInterface}.
 *
 * Persists a `search_sync_jobs` row for every operation and returns
 * the row. Real background-job dispatch lands with the job pipeline
 * build-out. Consumers override by binding their own concrete through
 * the interface's `#[Bind]`.
 *
 * `#[Scoped]` because writes touch tenant + causer context resolved
 * per request under Octane.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultIndexOrchestrator implements IndexOrchestratorInterface
{
    public function __construct(
        private readonly SearchSyncJobRepositoryInterface $syncJobs,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function reindex(string $searchIndexId, array $params = []): SearchSyncJob
    {
        return $this->createSyncJob($searchIndexId, 'reindex', $params);
    }

    /**
     * {@inheritDoc}
     */
    public function flush(string $searchIndexId, array $params = []): SearchSyncJob
    {
        return $this->createSyncJob($searchIndexId, 'flush', $params);
    }

    /**
     * {@inheritDoc}
     */
    public function swapAlias(string $searchIndexId, int $targetVersion): SearchSyncJob
    {
        return $this->createSyncJob($searchIndexId, 'alias_swap', [
            'target_version' => $targetVersion,
        ]);
    }

    /**
     * {@inheritDoc}
     */
    public function cancel(string $searchSyncJobId, ?string $reason = null): SearchSyncJob
    {
        /** @var SearchSyncJob $job */
        $job = $this->syncJobs->findOrFail($searchSyncJobId);

        $job->{SearchSyncJobInterface::ATTR_STATUS}        = SearchSyncJobStatus::Cancelling;
        $job->{SearchSyncJobInterface::ATTR_CANCEL_REASON} = $reason;
        $job->save();

        return $job;
    }

    /**
     * Persist one operational record. Real dispatch (Bus::batch of
     * shard jobs, alias-swap job) lands with the job pipeline.
     *
     * @param  array<string, mixed>  $params
     */
    private function createSyncJob(string $searchIndexId, string $kind, array $params): SearchSyncJob
    {
        /** @var SearchSyncJob $job */
        $job = $this->syncJobs->create([
            SearchSyncJobInterface::ATTR_SEARCH_INDEX_ID => $searchIndexId,
            SearchSyncJobInterface::ATTR_KIND            => $kind,
            SearchSyncJobInterface::ATTR_STATUS          => SearchSyncJobStatus::Queued->value,
            SearchSyncJobInterface::ATTR_SOURCE          => (string) ($params['source'] ?? 'live'),
            SearchSyncJobInterface::ATTR_PARAMS          => $params,
        ]);

        return $job;
    }
}
