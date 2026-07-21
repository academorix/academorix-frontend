<?php

declare(strict_types=1);

namespace Stackra\Search\Jobs;

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
 * Coordinator at the tail of the shard batch.
 *
 * Aggregates every shard's counters into the `SearchSyncJob` row and
 * decides `succeeded` / `partially_succeeded` / `failed`. Only when
 * status = `succeeded` does it dispatch `SwapIndexAliasJob`.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Queue('search')]
#[Tries(2)]
final class ReindexCoordinatorJob implements ShouldBeUnique, ShouldQueue
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
        // Scaffold — coordinator aggregation lands with the pipeline.
    }

    public function failed(\Throwable $e): void
    {
        unset($e);
    }
}
