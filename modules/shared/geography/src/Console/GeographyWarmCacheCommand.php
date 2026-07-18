<?php

declare(strict_types=1);

namespace Academorix\Geography\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Geography\Jobs\WarmReferenceCatalogCacheJob;

/**
 * `php artisan geography:warm-cache` — dispatch
 * {@see WarmReferenceCatalogCacheJob} on demand.
 *
 * The job normally runs hourly via schedule.json; this command lets
 * operators warm the cache after a deploy without waiting for the
 * next tick.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'geography:warm-cache',
    description: 'Warm the geography.cache Redis entries for the low-cardinality catalogs.',
)]
final class GeographyWarmCacheCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'geography:warm-cache
        {--top=200 : Top-N most-hit tuples to warm}
        {--locale=* : Locales to warm (repeatable)}';

    public function handle(): int
    {
        $this->omni->titleBar('Warm Geography Cache', 'emerald');

        WarmReferenceCatalogCacheJob::dispatch();

        $this->omni->success('WarmReferenceCatalogCacheJob dispatched.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
