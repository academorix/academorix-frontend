<?php

declare(strict_types=1);

namespace Academorix\Search\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Search\Contracts\Repositories\SearchIndexRepositoryInterface;
use Academorix\Search\Contracts\Services\IndexOrchestratorInterface;

/**
 * `php artisan search:flush` — drop a model's search index (all versions).
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'search:flush',
    description: 'Drop a model\'s search index. Destructive.',
)]
final class SearchFlushCommand extends BaseCommand
{
    protected $signature = 'search:flush
        {model : FQCN or table name to flush}
        {--engine= : Filter by engine adapter}
        {--yes : Skip confirmation}';

    public function handle(
        SearchIndexRepositoryInterface $indexes,
        IndexOrchestratorInterface $orchestrator,
    ): int {
        $this->omni->titleBar('Search Flush', 'rose');

        $modelArg = (string) $this->argument('model');
        $index    = $indexes->findByModelClass($modelArg);

        if ($index === null) {
            $this->omni->error(\sprintf('No index registered for %s.', $modelArg));
            $this->showDuration();

            return self::FAILURE;
        }

        $job = $orchestrator->flush((string) $index->getKey());
        $this->omni->success(\sprintf('Queued flush job %s.', (string) $job->getKey()));
        $this->showDuration();

        return self::SUCCESS;
    }
}
