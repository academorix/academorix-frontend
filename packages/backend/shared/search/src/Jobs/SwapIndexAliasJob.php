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
 * Atomically repoint `{index}_live` from the source version to the
 * target version via the engine adapter's native alias-swap op.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Queue('search')]
#[Tries(5)]
#[Backoff(10, 30, 90, 300, 900)]
final class SwapIndexAliasJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $searchIndexId,
        public readonly int $targetVersion,
    ) {
    }

    #[UniqueFor(1800)]
    public function uniqueId(): string
    {
        return $this->searchIndexId;
    }

    public function handle(): void
    {
        // Scaffold — alias-swap dispatch lands with the adapter.
    }

    public function failed(\Throwable $e): void
    {
        unset($e);
    }
}
