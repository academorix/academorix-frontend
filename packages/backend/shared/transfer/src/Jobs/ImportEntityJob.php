<?php

declare(strict_types=1);

namespace Stackra\Transfer\Jobs;

use Stackra\Transfer\Contracts\Services\ImportManagerInterface;
use Stackra\Transfer\Models\XferJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Top-level orchestrator for a single import.
 *
 * Delegates to {@see ImportManagerInterface::dispatch()} which
 * constructs the maatwebsite/excel `AbstractDynamicImport` and
 * queues the chain. `tries=1` because chunk-level retries live
 * inside Laravel Excel itself.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Queue('transfer')]
#[Tries(1)]
final class ImportEntityJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string  $xferJobId  Prefixed ULID of the persisted job row.
     */
    public function __construct(public readonly string $xferJobId)
    {
    }

    /**
     * Resolve the job row + hand off to the import manager.
     */
    public function handle(ImportManagerInterface $importer): void
    {
        $job = XferJob::query()->find($this->xferJobId);
        if ($job === null) {
            return;
        }

        $importer->dispatch($job);
    }

    /**
     * Job-level failure hook — leave the observer to fire the
     * `XferJobFailed` event when it marks the row as failed.
     */
    public function failed(\Throwable $e): void
    {
        // No-op — the manager's own `failed()` handler updates the
        // xfer_job row, which fires the observer + event.
    }
}
