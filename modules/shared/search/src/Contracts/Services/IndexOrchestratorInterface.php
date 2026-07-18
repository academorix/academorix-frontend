<?php

declare(strict_types=1);

namespace Academorix\Search\Contracts\Services;

use Academorix\Search\Models\SearchSyncJob;
use Academorix\Search\Services\DefaultIndexOrchestrator;
use Illuminate\Container\Attributes\Bind;

/**
 * Orchestrator for long-running index operations — reindex, backfill,
 * flush, alias-swap.
 *
 * Consumers call `reindex()`, `flush()`, or `swapAlias()`; the
 * orchestrator persists a `search_sync_jobs` row and dispatches the
 * matching background job.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Bind(DefaultIndexOrchestrator::class)]
interface IndexOrchestratorInterface
{
    /**
     * Trigger a zero-downtime reindex against a fresh target version.
     *
     * @param  string               $searchIndexId  ULID of the SearchIndex row.
     * @param  array<string, mixed> $params         Request params (source,
     *                                              filters, notify_channels).
     */
    public function reindex(string $searchIndexId, array $params = []): SearchSyncJob;

    /**
     * Drop an index physically. Records a `flush` sync job.
     *
     * @param  array<string, mixed> $params
     */
    public function flush(string $searchIndexId, array $params = []): SearchSyncJob;

    /**
     * Atomically swap the live alias from the current version to
     * the target version.
     */
    public function swapAlias(string $searchIndexId, int $targetVersion): SearchSyncJob;

    /**
     * Cancel a queued or running sync job.
     */
    public function cancel(string $searchSyncJobId, ?string $reason = null): SearchSyncJob;
}
