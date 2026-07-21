<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Console\Commands;

use Stackra\Console\Commands\BaseCommand;
use Academorix\Geofencing\Jobs\ReconcileGeofenceCheckImmutabilityJob;
use Symfony\Component\Console\Attribute\AsCommand;

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

    /**
     * @var string
     */
    protected $description = 'Enqueue the geofence check immutability reconciliation job.';

    public function handle(): int
    {
        if ($this->option('dry-run')) {
            $this->info('Dry-run — no job enqueued.');

            return self::SUCCESS;
        }

        ReconcileGeofenceCheckImmutabilityJob::dispatch();
        $this->info('Immutability reconciliation job dispatched.');

        return self::SUCCESS;
    }
}
