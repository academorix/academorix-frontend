<?php

declare(strict_types=1);

namespace Academorix\Search\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Search\Contracts\Repositories\SearchIndexRepositoryInterface;
use Academorix\Search\Contracts\Services\IndexOrchestratorInterface;

/**
 * `php artisan search:reindex` — trigger a zero-downtime reindex.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'search:reindex',
    description: 'Trigger a zero-downtime reindex.',
)]
final class SearchReindexCommand extends BaseCommand
{
    protected $signature = 'search:reindex
        {model? : Optional model FQCN}
        {--engine= : Filter by engine adapter}
        {--from-artifact= : Reindex from an XferArtifact instead of live DB}
        {--async : Dispatch to the queue (default: true)}
        {--sync-source=live : Source of truth (live or xfer_artifact)}
        {--as= : Impersonate a target user id}
        {--no-notify : Suppress the completion notification}';

    public function handle(
        SearchIndexRepositoryInterface $indexes,
        IndexOrchestratorInterface $orchestrator,
    ): int {
        $this->omni->titleBar('Search Reindex', 'sky');

        $modelArg = $this->argument('model');
        $rows     = $modelArg === null
            ? $indexes->all()
            : $indexes->all()->filter(
                static fn ($i) => (string) $i->model_class === (string) $modelArg,
            );

        if ($rows->isEmpty()) {
            $this->omni->info('No matching indexes to reindex.');
            $this->showDuration();

            return self::SUCCESS;
        }

        foreach ($rows as $index) {
            $job = $orchestrator->reindex((string) $index->getKey(), [
                'source' => (string) $this->option('sync-source'),
            ]);
            $this->omni->info(\sprintf('Queued %s', (string) $job->getKey()));
        }

        $this->omni->success(\sprintf('Queued %d reindex job(s).', $rows->count()));
        $this->showDuration();

        return self::SUCCESS;
    }
}
