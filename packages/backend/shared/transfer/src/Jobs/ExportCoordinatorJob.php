<?php

declare(strict_types=1);

namespace Stackra\Transfer\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Coordinator for sharded exports — merges per-shard files into a
 * single result artifact (single XLSX with N sheets), or zips them
 * when merging is not requested.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Queue('transfer')]
#[Tries(2)]
final class ExportCoordinatorJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string  $xferJobId  Prefixed ULID of the parent job.
     */
    public function __construct(public readonly string $xferJobId)
    {
    }

    public function handle(): void
    {
        // Real impl aggregates + writes the final artifact.
    }

    public function failed(\Throwable $e): void
    {
    }
}
