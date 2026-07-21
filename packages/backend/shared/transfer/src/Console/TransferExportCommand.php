<?php

declare(strict_types=1);

namespace Stackra\Transfer\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Transfer\Contracts\Data\XferJobInterface;
use Stackra\Transfer\Contracts\Repositories\XferJobRepositoryInterface;
use Stackra\Transfer\Enums\XferKind;
use Stackra\Transfer\Jobs\ExportEntityJob;

/**
 * `php artisan transfer:export` — CLI export.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'transfer:export',
    description: 'Run an export from the CLI.',
)]
final class TransferExportCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'transfer:export {entity} {--format=xlsx} {--sync}';

    public function handle(XferJobRepositoryInterface $jobs): int
    {
        $this->omni->titleBar('Transfer Export', 'sky');

        /** @var \Stackra\Transfer\Models\XferJob $job */
        $job = $jobs->create([
            XferJobInterface::ATTR_KIND       => XferKind::Export->value,
            XferJobInterface::ATTR_ENTITY_KEY => (string) $this->argument('entity'),
            XferJobInterface::ATTR_FORMAT     => (string) $this->option('format'),
        ]);

        ExportEntityJob::dispatch((string) $job->getKey());
        $this->omni->success(\sprintf('Export job dispatched: %s', (string) $job->getKey()));
        $this->showDuration();

        return self::SUCCESS;
    }
}
