<?php

declare(strict_types=1);

namespace Stackra\Transfer\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Compose an errors.csv artifact from row-level failures collected
 * by `AbstractDynamicImport` (SkipsFailures) during a partially-
 * succeeded import.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Queue('transfer')]
#[Tries(3)]
#[Backoff(30, 120, 600)]
final class WriteErrorsArtifactJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string  $xferJobId  Prefixed ULID of the parent job row.
     */
    public function __construct(public readonly string $xferJobId)
    {
    }

    public function handle(): void
    {
        // Real impl writes the errors.csv and links it back.
    }

    public function failed(\Throwable $e): void
    {
    }
}
