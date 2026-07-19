<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Entitlements\Jobs\ReconcileUsageJob;

/**
 * `php artisan entitlements:reconcile {--tenant=}` — dispatch a
 * `ReconcileUsageJob` for one tenant (or every tenant when the option
 * is omitted).
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'entitlements:reconcile',
    description: 'Reconcile Redis / Postgres drift on entitlement counters.',
)]
final class EntitlementsReconcileCommand extends BaseCommand
{
    protected $signature = 'entitlements:reconcile
        {--tenant= : Reconcile only this tenant\'s entitlements}';

    public function handle(): int
    {
        $this->omni->titleBar('Entitlements — Reconcile', 'sky');

        $tenant = $this->option('tenant');
        $arg    = \is_string($tenant) && $tenant !== '' ? $tenant : null;

        ReconcileUsageJob::dispatch($arg);

        $this->omni->success(
            $arg !== null
                ? \sprintf('Reconcile dispatched for tenant "%s".', $arg)
                : 'Bulk reconcile dispatched.',
        );
        $this->showDuration();

        return self::SUCCESS;
    }
}
