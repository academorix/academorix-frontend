<?php

declare(strict_types=1);

namespace Stackra\Geofencing\Jobs;

use Stackra\Geofencing\Contracts\Repositories\GeofenceCheckRepositoryInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Container\Attributes\Config;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * GDPR retention path. Soft-delete non-override rows past the tenant's
 * retention window. Override rows keep the longer floor per
 * `geofencing.retention.override_row_hot_years`.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(2)]
final class PurgeStaleGeofenceChecksJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $uniqueFor = 86400;

    public function uniqueId(): string
    {
        return 'geofencing:purge-stale-checks';
    }

    public function handle(
        GeofenceCheckRepositoryInterface $repository,
        #[Config('geofencing.retention.default_hot_years')] int $hotYears,
    ): void {
        $cutoff = now()->subYears(\max(1, $hotYears));

        $repository->pruneOlderThan($cutoff);
    }
}
