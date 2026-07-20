<?php

declare(strict_types=1);

namespace Academorix\Storage\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Storage\Contracts\Data\FileInterface;
use Academorix\Storage\Contracts\Repositories\FileRepositoryInterface;
use Academorix\Storage\Jobs\GenerateFileVariantsJob;

/**
 * `php artisan storage:reprocess-variants` — dispatch
 * {@see GenerateFileVariantsJob} for every File that carries at
 * least one declared variant. Optional tenant + kind filters.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'storage:reprocess-variants',
    description: 'Dispatch GenerateFileVariantsJob for every matching File row.',
)]
final class StorageReprocessVariantsCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'storage:reprocess-variants
        {--tenant= : Limit to one tenant id}
        {--kind=   : Limit to one file kind}';

    public function handle(FileRepositoryInterface $files): int
    {
        $this->omni->titleBar('Storage — Reprocess Variants', 'sky');

        $q = $files->query()->withoutGlobalScopes();
        if (($tenant = $this->option('tenant')) !== null && $tenant !== '') {
            $q->where(FileInterface::ATTR_TENANT_ID, $tenant);
        }
        if (($kind = $this->option('kind')) !== null && $kind !== '') {
            $q->where(FileInterface::ATTR_KIND, $kind);
        }

        $rows = $q->get();
        if ($rows->isEmpty()) {
            $this->omni->info('No matching files found.');
            $this->showDuration();

            return self::SUCCESS;
        }

        foreach ($rows as $row) {
            GenerateFileVariantsJob::dispatch((string) $row->getKey());
        }

        $this->omni->success(\sprintf('Queued %d GenerateFileVariantsJob(s).', $rows->count()));
        $this->showDuration();

        return self::SUCCESS;
    }
}
