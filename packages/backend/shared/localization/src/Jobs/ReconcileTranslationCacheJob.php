<?php

declare(strict_types=1);

namespace Stackra\Localization\Jobs;

use Stackra\Localization\Contracts\Services\TranslationCacheInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Rebuild the translation cache from the DB.
 *
 * Wipes the cache and re-warms the hot tenants. Present for the
 * `localization:reconcile-cache` command's dry-run + apply paths.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Queue('translations')]
#[Timeout(600)]
#[Tries(1)]
final class ReconcileTranslationCacheJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  bool  $flushFirst  Wipe the cache before re-warming.
     */
    public function __construct(
        public readonly bool $flushFirst = true,
    ) {
    }

    public function handle(TranslationCacheInterface $cache): void
    {
        if ($this->flushFirst) {
            $cache->flush();
        }

        // Re-warming is per-tenant work owned by the WarmTranslationCacheJob.
        // A future pass will iterate the tenant catalogue here; for
        // now the cache flush is the entry point and consumers
        // schedule per-tenant warms explicitly.
    }

    public function failed(\Throwable $e): void
    {
        // No-op.
    }
}
