<?php

declare(strict_types=1);

namespace Academorix\Settings\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Settings\Jobs\ImportSettingsJob;

/**
 * `php artisan settings:import {file}` — dispatch the import job for
 * a previously-exported settings payload.
 *
 * The file argument is a path (local or blob-storage URI) to a JSON
 * document produced by `settings:export`. Actual parsing +
 * validation happens on the queue worker.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'settings:import',
    description: 'Dispatch the settings import job.',
)]
final class SettingsImportCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'settings:import
        {file : Path to the exported JSON payload}
        {--tenant= : Tenant id to receive the import}';

    public function handle(): int
    {
        $this->omni->titleBar('Import Settings', 'amber');

        $tenant = (string) ($this->option('tenant') ?? '');
        $file   = (string) $this->argument('file');

        if ($tenant === '' || $file === '') {
            $this->omni->error('Refused — --tenant=<id> AND file argument are required.');
            $this->showDuration();

            return self::FAILURE;
        }

        // Minimal parse — the worker re-reads the file for validation
        // + upsert; we only decode here to fail fast on a bad JSON.
        $raw = @\file_get_contents($file);
        if ($raw === false) {
            $this->omni->error(\sprintf('Cannot read file "%s".', $file));
            $this->showDuration();

            return self::FAILURE;
        }

        /** @var array<string, mixed>|null $payload */
        $payload = \json_decode($raw, true);
        if (! \is_array($payload)) {
            $this->omni->error('Refused — file is not valid JSON.');
            $this->showDuration();

            return self::FAILURE;
        }

        ImportSettingsJob::dispatch($tenant, $payload);

        $this->omni->success(\sprintf('Dispatched ImportSettingsJob for tenant "%s".', $tenant));
        $this->showDuration();

        return self::SUCCESS;
    }
}
