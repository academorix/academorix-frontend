<?php

declare(strict_types=1);

namespace Academorix\Search\Jobs;

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
 * Fan out the sync-completion / failure notification through the
 * notifications module using the frozen `notify_channels` +
 * `notify_locale` on the row.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(5)]
#[Backoff(10, 60, 300, 1800, 3600)]
final class SendSearchSyncNotificationJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $searchSyncJobId,
        public readonly string $status,
    ) {
    }

    #[UniqueFor(3600)]
    public function uniqueId(): string
    {
        return \sprintf('%s:%s', $this->searchSyncJobId, $this->status);
    }

    public function handle(): void
    {
        // Scaffold — notifications module dispatch lands with the
        // notifications-module wire-up.
    }

    public function failed(\Throwable $e): void
    {
        unset($e);
    }
}
