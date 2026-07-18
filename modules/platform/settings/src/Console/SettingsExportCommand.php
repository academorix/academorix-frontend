<?php

declare(strict_types=1);

namespace Academorix\Settings\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Settings\Jobs\ExportSettingsJob;

/**
 * `php artisan settings:export {--tenant=}` — dispatch the export job
 * for a tenant.
 *
 * Deliberately non-blocking — the actual export runs on the queue so
 * the CLI returns immediately. Callers monitor completion via the
 * activity log.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'settings:export',
    description: 'Dispatch the settings export job for a tenant.',
)]
final class SettingsExportCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'settings:export {--tenant= : Tenant id to export}';

    public function handle(): int
    {
        $this->omni->titleBar('Export Settings', 'sky');

        $tenant = (string) ($this->option('tenant') ?? '');
        if ($tenant === '') {
            $this->omni->error('Refused — --tenant=<id> is required.');
            $this->showDuration();

            return self::FAILURE;
        }

        ExportSettingsJob::dispatch($tenant);

        $this->omni->success(\sprintf('Dispatched ExportSettingsJob for tenant "%s".', $tenant));
        $this->showDuration();

        return self::SUCCESS;
    }
}
