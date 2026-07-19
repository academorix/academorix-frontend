<?php

declare(strict_types=1);

namespace Academorix\Storage\Jobs;

use Academorix\Storage\Contracts\Data\FileInterface;
use Academorix\Storage\Models\File;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Force-delete every {@see File} row that has been soft-deleted for
 * more than the retention window.
 *
 * `AsRetentionPolicy` on the model registers the policy — this job
 * is invoked by the scheduler as a fallback when the policy engine
 * is unavailable.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Queue('retention')]
#[Timeout(600)]
#[Tries(2)]
final class PurgeExpiredFilesJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(): void
    {
        $days = (int) \config('storage.retention.file_hard_delete_days', 365);
        $cut  = \Carbon\CarbonImmutable::now()->subDays($days);

        File::withTrashed()
            ->whereNotNull(FileInterface::ATTR_DELETED_AT)
            ->where(FileInterface::ATTR_DELETED_AT, '<', $cut)
            ->get()
            ->each(static fn (File $f): mixed => $f->forceDelete());
    }

    public function failed(\Throwable $e): void
    {
    }
}
