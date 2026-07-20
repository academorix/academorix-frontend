<?php

declare(strict_types=1);

namespace Academorix\Subscription\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Subscription\Jobs\ReconcileSubscriptionStateJob;

/**
 * `php artisan subscription:sync-cashier` — dispatch the
 * reconciliation job that samples our state vs Cashier's.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'subscription:sync-cashier',
    description: 'Dispatch the reconciliation job to sample subscription state drift.',
)]
final class SubscriptionSyncCashierCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'subscription:sync-cashier
        {--tenant= : Restrict the sample to one tenant}
        {--reconcile : Force a full reconciliation pass}
        {--dry-run : Do not queue the job; report intent only}';

    public function handle(): int
    {
        $this->omni->titleBar('Subscription — Sync Cashier', 'sky');

        $dryRun = (bool) $this->option('dry-run');

        if ($dryRun) {
            $this->omni->info('Dry run — the reconciliation job was NOT dispatched.');
            $this->showDuration();

            return self::SUCCESS;
        }

        ReconcileSubscriptionStateJob::dispatch();

        $this->omni->success('Reconciliation job dispatched.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
