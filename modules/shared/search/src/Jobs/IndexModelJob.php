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
 * Push one model to its configured search index.
 *
 * Dispatched by `HasSearchable`'s `saved` observer with a 30s unique
 * window so rapid re-saves collapse.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Queue('search')]
#[Tries(5)]
#[Backoff(10, 60, 300, 900, 3600)]
final class IndexModelJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $modelType,
        public readonly string $modelId,
    ) {
    }

    #[UniqueFor(30)]
    public function uniqueId(): string
    {
        return \sprintf('search-index:%s:%s', $this->modelType, $this->modelId);
    }

    public function handle(): void
    {
        // Scaffold — real dispatch through the resolved engine
        // adapter lands with the engine-adapter build-out.
    }

    public function failed(\Throwable $e): void
    {
        // Report / compensate. Silent by design — jobs must not
        // `throw` from failed().
        unset($e);
    }
}
