<?php

declare(strict_types=1);

namespace Academorix\Transfer\Jobs;

use Academorix\Transfer\Contracts\Services\ExportManagerInterface;
use Academorix\Transfer\Models\XferJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Top-level orchestrator for a single export.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Queue('transfer')]
#[Tries(1)]
final class ExportEntityJob implements ShouldQueue
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

    public function handle(ExportManagerInterface $exporter): void
    {
        $job = XferJob::query()->find($this->xferJobId);
        if ($job === null) {
            return;
        }

        $exporter->dispatch($job);
    }

    public function failed(\Throwable $e): void
    {
        // No-op — see ImportEntityJob rationale.
    }
}
