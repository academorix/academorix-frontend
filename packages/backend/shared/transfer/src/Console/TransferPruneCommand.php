<?php

declare(strict_types=1);

namespace Stackra\Transfer\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Transfer\Jobs\PruneXferArtifactsJob;

/**
 * `php artisan transfer:prune` — dispatch the retention prune.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'transfer:prune',
    description: 'Dispatch the retention prune job.',
)]
final class TransferPruneCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'transfer:prune {--dry-run} {--tenant=}';

    public function handle(): int
    {
        $this->omni->titleBar('Transfer Prune', 'amber');

        PruneXferArtifactsJob::dispatch();
        $this->omni->success('Prune job dispatched.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
