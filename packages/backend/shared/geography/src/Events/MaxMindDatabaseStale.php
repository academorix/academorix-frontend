<?php

declare(strict_types=1);

namespace Stackra\Geography\Events;

use Illuminate\Foundation\Events\Dispatchable;

use Stackra\Events\Attributes\AsEvent;
/**
 * Fired when the health probe detects the local GeoLite2-City.mmdb
 * is older than `config('geography.maxmind.stale_days')`.
 *
 * Consumed by {@see \Stackra\Geography\Listeners\DispatchRefreshMaxMindOnStale}
 * to trigger a refresh outside the weekly cadence.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class MaxMindDatabaseStale
{
    use Dispatchable;

    /**
     * @param  string  $path              Local path to the stale database.
     * @param  int     $ageDays           Age in days.
     * @param  string  $lastRefreshedAt   ISO-8601 timestamp of the last refresh.
     */
    public function __construct(
        public string $path,
        public int $ageDays,
        public string $lastRefreshedAt,
    ) {
    }
}
