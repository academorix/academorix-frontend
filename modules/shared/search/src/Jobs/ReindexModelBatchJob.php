<?php

declare(strict_types=1);

namespace Academorix\Search\Jobs;

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
 * Top-level reindex orchestrator.
 *
 * Creates a fresh empty target index, enumerates rows, shards the
 * work, dispatches `ReindexModelShardJob`s via `Bus::batch()`, and
 * chains the coordinator + alias-swap + notification jobs on
 * completion.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Queue('search')]
#[Tries(1)]
final class ReindexModelBatchJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $searchSyncJobId)
    {
    }

    #[UniqueFor(3600)]
    public function uniqueId(): string
    {
        return $this->searchSyncJobId;
    }

    public function handle(): void
    {
        // Scaffold — real batch build-out lands with the pipeline.
    }

    public function failed(\Throwable $e): void
    {
        unset($e);
    }
}
