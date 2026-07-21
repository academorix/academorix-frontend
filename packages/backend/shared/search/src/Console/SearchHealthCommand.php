<?php

declare(strict_types=1);

namespace Stackra\Search\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;

/**
 * `php artisan search:health` — probe every configured engine.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'search:health',
    description: 'Probe every configured search engine for reachability.',
)]
final class SearchHealthCommand extends BaseCommand
{
    protected $signature = 'search:health
        {--engine=* : Filter by engine adapter}
        {--check-drift : Trigger the config-hash drift check}
        {--json : Emit machine-parseable output}';

    public function handle(): int
    {
        $this->omni->titleBar('Search Health', 'sky');

        // Scaffold — real probing lands with the adapter build-out.
        $this->omni->info('Engine probing not yet implemented — scaffold in place.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
