<?php

declare(strict_types=1);

namespace Academorix\Geography\Events;

use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired after `RefreshMaxMindDatabaseJob` successfully replaces the
 * local GeoLite2-City.mmdb.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final readonly class MaxMindDatabaseRefreshed
{
    use Dispatchable;

    /**
     * @param  string  $path              Local path to the refreshed database.
     * @param  int     $downloadedBytes   Bytes written to disk.
     * @param  string  $databaseVersion   Reported version string (best-effort).
     * @param  int     $durationMs        Wall-clock duration in ms.
     */
    public function __construct(
        public string $path,
        public int $downloadedBytes,
        public string $databaseVersion,
        public int $durationMs,
    ) {
    }
}
