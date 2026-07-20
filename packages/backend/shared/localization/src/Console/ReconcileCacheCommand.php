<?php

declare(strict_types=1);

namespace Academorix\Localization\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Localization\Jobs\PruneStaleTranslationsJob;
use Academorix\Localization\Jobs\ReconcileTranslationCacheJob;

/**
 * `php artisan localization:reconcile-cache` — flush and optionally
 * prune stale translations.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'localization:reconcile-cache',
    description: 'Flush the translation cache and optionally prune stale rows.',
)]
final class ReconcileCacheCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'localization:reconcile-cache
        {--prune : Also dispatch PruneStaleTranslationsJob}
        {--dry-run : Preview without dispatching}';

    public function handle(): int
    {
        $prune  = (bool) $this->option('prune');
        $dryRun = (bool) $this->option('dry-run');

        $this->omni->titleBar('Reconcile Translation Cache', 'amber');

        if ($dryRun) {
            $this->omni->info(\sprintf(
                'Dry run — would flush the cache%s.',
                $prune ? ' and prune stale rows' : '',
            ));
            $this->showDuration();

            return self::SUCCESS;
        }

        ReconcileTranslationCacheJob::dispatch(flushFirst: true);
        if ($prune) {
            PruneStaleTranslationsJob::dispatch();
        }

        $this->omni->success('Reconcile dispatched.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
