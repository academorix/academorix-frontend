<?php

declare(strict_types=1);

namespace Stackra\Transfer\Jobs;

use Stackra\Transfer\Contracts\Services\SampleDataGeneratorInterface;
use Stackra\Transfer\Events\SampleDataGenerated;
use Stackra\Transfer\Models\XferJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Generate sample data for a `#[SampleData]`-annotated entity.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Queue('transfer')]
#[Tries(2)]
final class GenerateSampleDataJob implements ShouldQueue
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

    public function handle(SampleDataGeneratorInterface $generator): void
    {
        $job = XferJob::query()->find($this->xferJobId);
        if ($job === null) {
            return;
        }

        $count = $generator->generate($job);
        SampleDataGenerated::dispatch($job, $count);
    }

    public function failed(\Throwable $e): void
    {
        // No-op.
    }
}
