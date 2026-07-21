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
 * Coordinator at the end of the shard chain — aggregates counters
 * into the parent XferJob and decides succeeded vs
 * partially_succeeded vs failed.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Queue('transfer')]
#[Tries(2)]
final class ImportCoordinatorJob implements ShouldQueue
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
        // Real impl merges shard counters + updates the parent.
    }

    public function failed(\Throwable $e): void
    {
    }
}
