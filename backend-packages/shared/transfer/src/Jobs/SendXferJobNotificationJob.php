<?php

declare(strict_types=1);

namespace Academorix\Transfer\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Fan-out the completion / partial-success / failure notification
 * through the notifications module.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(5)]
#[Backoff(10, 60, 300, 1800, 3600)]
final class SendXferJobNotificationJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string  $xferJobId  Prefixed ULID of the parent job.
     * @param  string  $status     Terminal status name.
     */
    public function __construct(
        public readonly string $xferJobId,
        public readonly string $status,
    ) {
    }

    public function handle(): void
    {
        // Real impl reads xfer_jobs.notify_channels + dispatches.
    }

    public function failed(\Throwable $e): void
    {
        // Failure to notify does not un-complete the XferJob.
    }
}
