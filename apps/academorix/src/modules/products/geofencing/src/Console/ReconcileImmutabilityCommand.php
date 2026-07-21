<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Console;

use Stackra\Console\Commands\BaseCommand;
use Academorix\Geofencing\Jobs\ReconcileGeofenceCheckImmutabilityJob;
use Stackra\Console\Attributes\AsCommand;

/**
 * `geofencing:reconcile-immutability` — enqueue the immutability
 * reconciliation job on-demand.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'geofencing:reconcile-immutability',
    description: 'Enqueue the geofence check immutability reconciliation job.',
)]
final class ReconcileImmutabilityCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'geofencing:reconcile-immutability {--dry-run}';

    public function handle(): int
    {
        if ($this->option('dry-run')) {
            $this->omni->success('Dry-run — no job enqueued.');

            return self::SUCCESS;
        }

        ReconcileGeofenceCheckImmutabilityJob::dispatch();
        $this->omni->success('Immutability reconciliation job dispatched.');

        return self::SUCCESS;
    }
}
