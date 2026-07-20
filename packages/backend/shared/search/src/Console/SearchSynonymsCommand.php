<?php

declare(strict_types=1);

namespace Academorix\Search\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Search\Contracts\Repositories\SearchSynonymRepositoryInterface;

/**
 * `php artisan search:synonyms` — CRUD + bulk ops on `search_synonyms`.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'search:synonyms',
    description: 'CRUD + bulk operations on the synonym registry.',
)]
final class SearchSynonymsCommand extends BaseCommand
{
    protected $signature = 'search:synonyms
        {action : list|add|update|delete|warm-cache|import|export}
        {--tenant= : Tenant to scope by}
        {--language=en : Language tag}
        {--terms=* : Terms}
        {--kind=equivalent : Synonym kind}
        {--file= : Import / export file}
        {--id= : Synonym id for update / delete}
        {--as= : Impersonate a target user id}';

    public function handle(SearchSynonymRepositoryInterface $synonyms): int
    {
        $this->omni->titleBar('Search Synonyms', 'sky');

        $action = (string) $this->argument('action');

        // Full implementation lands with the synonym registry
        // build-out. Today the command prints a summary count so
        // ops has the surface available in the CLI.
        if ($action === 'list') {
            $tenant   = $this->option('tenant');
            $language = (string) $this->option('language');
            $rows     = $synonyms->activeFor($tenant, $language);
            $this->omni->info(\sprintf('%d synonym(s) active.', $rows->count()));
        } else {
            $this->omni->info(\sprintf('Action %s scaffolded.', $action));
        }

        $this->showDuration();

        return self::SUCCESS;
    }
}
