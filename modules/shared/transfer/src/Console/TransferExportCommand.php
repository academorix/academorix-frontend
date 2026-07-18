<?php

declare(strict_types=1);

namespace Academorix\Transfer\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Transfer\Contracts\Data\XferJobInterface;
use Academorix\Transfer\Contracts\Repositories\XferJobRepositoryInterface;
use Academorix\Transfer\Enums\XferKind;
use Academorix\Transfer\Jobs\ExportEntityJob;

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

        /** @var \Academorix\Transfer\Models\XferJob $job */
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
