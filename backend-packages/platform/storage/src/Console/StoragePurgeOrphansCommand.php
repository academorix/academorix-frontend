<?php

declare(strict_types=1);

namespace Academorix\Storage\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Storage\Jobs\DedupOrphanBlobsJob;

/**
 * `php artisan storage:purge-orphans` — dispatch the orphan-blob
 * sweep job. Use `--dry-run` to only report orphan counts.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'storage:purge-orphans',
    description: 'Dispatch DedupOrphanBlobsJob to reconcile refcounts.',
)]
final class StoragePurgeOrphansCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'storage:purge-orphans {--dry-run : Only count orphans, do not delete}';

    public function handle(): int
    {
        $this->omni->titleBar('Storage — Purge Orphan Blobs', 'sky');

        $dryRun = (bool) $this->option('dry-run');
        DedupOrphanBlobsJob::dispatch($dryRun);

        $this->omni->success($dryRun ? 'DedupOrphanBlobsJob queued (dry-run).' : 'DedupOrphanBlobsJob queued.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
