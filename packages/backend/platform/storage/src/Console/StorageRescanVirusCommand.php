<?php

declare(strict_types=1);

namespace Stackra\Storage\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Storage\Contracts\Data\FileInterface;
use Stackra\Storage\Contracts\Repositories\FileRepositoryInterface;
use Stackra\Storage\Enums\VirusScanState;
use Stackra\Storage\Jobs\ScanFileForVirusesJob;

/**
 * `php artisan storage:rescan-virus` — requeue AV scans for every
 * File currently in `pending` / `scan_failed` state. Useful after
 * AV signature updates.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'storage:rescan-virus',
    description: 'Requeue ScanFileForVirusesJob for pending / failed rows.',
)]
final class StorageRescanVirusCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'storage:rescan-virus {--tenant= : Limit to one tenant id}';

    public function handle(FileRepositoryInterface $files): int
    {
        $this->omni->titleBar('Storage — Rescan Antivirus', 'sky');

        $q = $files->query()
            ->withoutGlobalScopes()
            ->whereIn(FileInterface::ATTR_VIRUS_SCAN_STATE, [
                VirusScanState::Pending->value,
                VirusScanState::Failed->value,
            ]);

        if (($tenant = $this->option('tenant')) !== null && $tenant !== '') {
            $q->where(FileInterface::ATTR_TENANT_ID, $tenant);
        }

        $rows = $q->get();
        if ($rows->isEmpty()) {
            $this->omni->info('No files pending rescan.');
            $this->showDuration();

            return self::SUCCESS;
        }

        foreach ($rows as $row) {
            ScanFileForVirusesJob::dispatch((string) $row->getKey());
        }

        $this->omni->success(\sprintf('Queued %d ScanFileForVirusesJob(s).', $rows->count()));
        $this->showDuration();

        return self::SUCCESS;
    }
}
