<?php

declare(strict_types=1);

namespace Stackra\Search\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Search\Jobs\PruneSearchAnalyticsJob;

/**
 * `php artisan search:analytics` — analytics inspection + retention.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'search:analytics',
    description: 'Inspect search analytics + run retention.',
)]
final class SearchAnalyticsCommand extends BaseCommand
{
    protected $signature = 'search:analytics
        {action : summary|top|no-results|prune}
        {--tenant= : Tenant to scope by}
        {--from= : Lower time bound (ISO-8601)}
        {--to= : Upper time bound (ISO-8601)}
        {--limit=50 : Row cap}
        {--stale-only : Only prune stale-queued rows}
        {--json : Emit machine-parseable output}';

    public function handle(): int
    {
        $this->omni->titleBar('Search Analytics', 'sky');

        $action = (string) $this->argument('action');

        if ($action === 'prune') {
            PruneSearchAnalyticsJob::dispatch();
            $this->omni->success('Retention pruner queued.');
        } else {
            $this->omni->info(\sprintf('Action %s scaffolded.', $action));
        }

        $this->showDuration();

        return self::SUCCESS;
    }
}
