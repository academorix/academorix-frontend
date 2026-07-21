<?php

declare(strict_types=1);

namespace Stackra\Storage\Jobs;

use Stackra\Storage\Contracts\Services\ContentAddressableStoreInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Audit the content-addressable store — hard-delete every physical
 * blob whose refcount has drifted to zero.
 *
 * Long-running maintenance job — dispatched from the scheduler by
 * `storage:dedup-audit`. Delegates to the bound
 * {@see ContentAddressableStoreInterface} so the concrete backend
 * (S3, local disk, GCS) owns the walk.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Queue('retention')]
#[Timeout(1800)]
#[Tries(1)]
final class DedupOrphanBlobsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  bool  $dryRun  When true, only reports orphans without
     *                        deleting any physical bytes.
     */
    public function __construct(public readonly bool $dryRun = false)
    {
    }

    public function handle(ContentAddressableStoreInterface $blobs): void
    {
        // Delegate to the concrete store — it owns the "walk every
        // blob, decrement any whose row set is empty" semantics.
        $blobs->reconcileOrphans($this->dryRun);
    }

    public function failed(\Throwable $e): void
    {
        // Report via monitoring — orphaned blobs are billable disk
        // but never break a read.
    }
}
