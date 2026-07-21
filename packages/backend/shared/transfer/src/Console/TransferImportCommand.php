<?php

declare(strict_types=1);

namespace Stackra\Transfer\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Transfer\Contracts\Data\XferJobInterface;
use Stackra\Transfer\Contracts\Repositories\XferJobRepositoryInterface;
use Stackra\Transfer\Enums\XferKind;
use Stackra\Transfer\Jobs\ImportEntityJob;

/**
 * `php artisan transfer:import` — CLI import.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'transfer:import',
    description: 'Run an import from the CLI.',
)]
final class TransferImportCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'transfer:import {entity} {file} {--mode=upsert} {--dry-run} {--sync}';

    public function handle(XferJobRepositoryInterface $jobs): int
    {
        $this->omni->titleBar('Transfer Import', 'sky');

        /** @var \Stackra\Transfer\Models\XferJob $job */
        $job = $jobs->create([
            XferJobInterface::ATTR_KIND       => XferKind::Import->value,
            XferJobInterface::ATTR_ENTITY_KEY => (string) $this->argument('entity'),
            XferJobInterface::ATTR_MODE       => (string) $this->option('mode'),
            XferJobInterface::ATTR_SOURCE_PATH => (string) $this->argument('file'),
        ]);

        ImportEntityJob::dispatch((string) $job->getKey());
        $this->omni->success(\sprintf('Import job dispatched: %s', (string) $job->getKey()));
        $this->showDuration();

        return self::SUCCESS;
    }
}
