<?php

declare(strict_types=1);

namespace Academorix\Notifications\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Notifications\Jobs\ExpungeArchivedNotificationsJob;

/**
 * `php artisan notifications:expunge-archived` — hard-delete
 * archived notifications past their retention window.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'notifications:expunge-archived',
    description: 'Hard-delete archived notifications past their retention window.',
)]
final class NotificationsExpungeArchivedCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'notifications:expunge-archived
        {--batch=1000 : Rows to delete per batch}
        {--tenant= : Restrict to a single tenant}
        {--dry-run : Preview without writing}
        {--hard-delete : Actually purge (default is soft-delete only)}';

    public function handle(): int
    {
        $this->omni->titleBar('Expunge Archived Notifications', 'amber');

        $tenantId  = $this->option('tenant');
        $isDryRun  = (bool) $this->option('dry-run');
        $hardDel   = (bool) $this->option('hard-delete');

        // Dispatch the job for per-tenant work; when no tenant is
        // supplied the operator gets a guidance banner rather than a
        // blanket enumeration.
        if (\is_string($tenantId) && $tenantId !== '') {
            ExpungeArchivedNotificationsJob::dispatch($tenantId);
            $this->omni->success(\sprintf('Dispatched expunge job for tenant "%s".', $tenantId));
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->info(\sprintf(
            'No --tenant provided. Mode: %s. Hard delete: %s.',
            $isDryRun ? 'dry-run' : 'live',
            $hardDel ? 'yes' : 'no',
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
