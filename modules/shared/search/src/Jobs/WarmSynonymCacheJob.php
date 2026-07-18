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
 * Push the current effective synonym set to every configured engine
 * for a `(tenant, language)` pair.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Queue('search')]
#[Tries(3)]
#[Backoff(10, 30, 120)]
final class WarmSynonymCacheJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly ?string $tenantId,
        public readonly string $language,
    ) {
    }

    #[UniqueFor(60)]
    public function uniqueId(): string
    {
        return \sprintf('%s:%s', $this->tenantId ?? 'platform', $this->language);
    }

    public function handle(): void
    {
        // Scaffold — engine-native warm-up dispatch lands with the adapter.
    }

    public function failed(\Throwable $e): void
    {
        unset($e);
    }
}
