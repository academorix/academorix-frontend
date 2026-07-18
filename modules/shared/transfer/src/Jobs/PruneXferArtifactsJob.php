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
 * Retention scan for artifacts + jobs. Runs on schedule; four
 * passes per invocation:
 *
 *   1. Artifact files past `retention_expires_at`.
 *   2. Job rows past their retention tier.
 *   3. Stale queued/running sweep.
 *   4. Mapping-profile soft-delete → hard-delete after grace.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(2)]
final class PruneXferArtifactsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(): void
    {
        // Real impl runs the four passes.
    }

    public function failed(\Throwable $e): void
    {
    }
}
