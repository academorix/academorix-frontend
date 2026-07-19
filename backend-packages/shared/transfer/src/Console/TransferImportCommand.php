<?php

declare(strict_types=1);

namespace Academorix\Transfer\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Transfer\Contracts\Data\XferJobInterface;
use Academorix\Transfer\Contracts\Repositories\XferJobRepositoryInterface;
use Academorix\Transfer\Enums\XferKind;
use Academorix\Transfer\Jobs\ImportEntityJob;

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

        /** @var \Academorix\Transfer\Models\XferJob $job */
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
