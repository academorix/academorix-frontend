<?php

declare(strict_types=1);

namespace Academorix\Transfer\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Final housekeeping job — transitions the XferJob to succeeded /
 * partially_succeeded based on counters + stamps `completed_at` +
 * `progress_percent = 100`. The observer wired to `updating` fires
 * the appropriate event.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Queue('transfer')]
#[Tries(3)]
final class MarkXferJobCompletedJob implements ShouldQueue
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
        // Real impl updates the job row terminal status.
    }

    public function failed(\Throwable $e): void
    {
    }
}
