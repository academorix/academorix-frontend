<?php

declare(strict_types=1);

namespace Academorix\Search\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Search\Contracts\Repositories\SearchSyncJobRepositoryInterface;

/**
 * `php artisan search:jobs` — list search sync jobs.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'search:jobs',
    description: 'List search sync jobs for ops observability.',
)]
final class SearchJobsCommand extends BaseCommand
{
    protected $signature = 'search:jobs
        {--status=* : Filter by status}
        {--kind=* : Filter by kind}
        {--tenant= : Filter by tenant id}
        {--limit=50 : Row cap}
        {--json : Emit machine-parseable output}';

    public function handle(SearchSyncJobRepositoryInterface $syncJobs): int
    {
        $this->omni->titleBar('Search Sync Jobs', 'sky');

        /** @var list<string> $statuses */
        $statuses = (array) $this->option('status');
        $rows     = $statuses !== []
            ? $syncJobs->findByStatus($statuses)
            : $syncJobs->all();

        $this->omni->info(\sprintf('%d job(s).', $rows->count()));
        $this->showDuration();

        return self::SUCCESS;
    }
}
