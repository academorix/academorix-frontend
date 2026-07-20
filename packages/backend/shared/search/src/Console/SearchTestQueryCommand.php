<?php

declare(strict_types=1);

namespace Academorix\Search\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Search\Contracts\Services\SearchServiceInterface;

/**
 * `php artisan search:test-query` — run a query from the CLI + print results.
 *
 * Useful for admin diagnostics + relevance tuning without polluting
 * analytics (`--no-record`).
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'search:test-query',
    description: 'Run a search query from the CLI.',
)]
final class SearchTestQueryCommand extends BaseCommand
{
    protected $signature = 'search:test-query
        {query : Query text}
        {--model=* : Filter by model FQCN}
        {--engine= : Engine adapter override}
        {--limit=10 : Result cap}
        {--filter=* : Filter expressions}
        {--facets=* : Facet requests}
        {--boost=* : Boost overrides}
        {--no-record : Do not write an analytics event}
        {--json : Emit machine-parseable output}';

    public function handle(SearchServiceInterface $search): int
    {
        $this->omni->titleBar('Search Test Query', 'sky');

        $query = (string) $this->argument('query');
        $result = $search->query($query, [
            'limit'  => (int) $this->option('limit'),
            'engine' => $this->option('engine'),
        ]);

        $this->omni->success(\sprintf(
            '%d hit(s) in %d ms.',
            (int) ($result['meta']['total'] ?? 0),
            (int) ($result['meta']['took_ms'] ?? 0),
        ));

        $this->showDuration();

        return self::SUCCESS;
    }
}
