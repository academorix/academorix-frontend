<?php

declare(strict_types=1);

namespace Academorix\Storage\Jobs;

use Academorix\Storage\Contracts\Data\ChunkedUploadInterface;
use Academorix\Storage\Contracts\Repositories\ChunkedUploadRepositoryInterface;
use Academorix\Storage\Contracts\Services\ChunkedUploadCoordinatorInterface;
use Academorix\Storage\Enums\ChunkedUploadState;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Mark every expired {@see \Academorix\Storage\Models\ChunkedUpload}
 * as `expired`, release provider-side resources, and hard-delete
 * the row.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Queue('retention')]
#[Timeout(300)]
#[Tries(2)]
final class PurgeAbortedChunkedUploadsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(
        ChunkedUploadRepositoryInterface $uploads,
        ChunkedUploadCoordinatorInterface $coordinator,
    ): void {
        $now = \Carbon\CarbonImmutable::now();

        foreach ($uploads->findExpired($now) as $upload) {
            // fail-soft — a bad provider must not stop the sweep.
            try {
                $coordinator->abort($upload, 'expired');
            } catch (\Throwable) {
                // logged elsewhere; keep sweeping.
            }

            $upload->update([
                ChunkedUploadInterface::ATTR_STATE        => ChunkedUploadState::Expired->value,
                ChunkedUploadInterface::ATTR_FINALIZED_AT => $now,
                ChunkedUploadInterface::ATTR_ABORT_REASON => 'expired',
            ]);

            $upload->delete();
        }
    }

    public function failed(\Throwable $e): void
    {
    }
}
