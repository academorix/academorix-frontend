<?php

declare(strict_types=1);

namespace Stackra\Search\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Run one shard of a sharded reindex.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Queue('search')]
#[Tries(3)]
#[Backoff(60, 300, 900)]
final class ReindexModelShardJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $searchSyncJobId,
        public readonly int $shardIndex,
        public readonly int $offset,
        public readonly int $limit,
    ) {
    }

    #[UniqueFor(3600)]
    public function uniqueId(): string
    {
        return \sprintf('%s:%d', $this->searchSyncJobId, $this->shardIndex);
    }

    public function handle(): void
    {
        // Scaffold — real shard dispatch lands with the pipeline.
    }

    public function failed(\Throwable $e): void
    {
        unset($e);
    }
}
