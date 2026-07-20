<?php

declare(strict_types=1);

namespace Academorix\Search\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Drop a physical engine index version.
 *
 * Two triggers: (1) `SearchIndex` soft-deleted + `swap_grace_days`
 * elapsed. (2) Post-alias-swap grace on the previous physical version.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Queue('search')]
#[Tries(3)]
#[Backoff(60, 600, 3600)]
final class PurgeIndexModelJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $searchIndexId,
        public readonly int $version,
        public readonly bool $force = false,
    ) {
    }

    #[UniqueFor(3600)]
    public function uniqueId(): string
    {
        return \sprintf('search-purge:%s:%d', $this->searchIndexId, $this->version);
    }

    public function handle(): void
    {
        // Scaffold — engine drop dispatch lands with the adapter.
    }

    public function failed(\Throwable $e): void
    {
        unset($e);
    }
}
